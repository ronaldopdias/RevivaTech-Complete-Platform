const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import authentication middleware
const {
  generateTokens,
  hashPassword,
  verifyPassword,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  generateVerificationToken,
  generatePasswordResetToken,
  authenticateToken,
  optionalAuth
} = require('../middleware/authentication');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests, please try again later'
});

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// refreshSchema removed - refresh token now comes from httpOnly cookies

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

// Register new user
router.post('/register', authLimiter, async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { email, password, firstName, lastName, phone } = value;

    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const verificationToken = generateVerificationToken();

    // Generate user ID
    const crypto = require('crypto');
    const userId = crypto.randomBytes(12).toString('base64url');

    // Create user
    const userQuery = `
      INSERT INTO users (id, email, password_hash, "firstName", "lastName", phone, role, "isVerified", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, email, "firstName", "lastName", role, "createdAt"
    `;

    const userResult = await client.query(userQuery, [
      userId,
      email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone || null,
      'CUSTOMER', // Default role
      false // Email not verified initially
    ]);

    const user = userResult.rows[0];

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const deviceInfo = {
      userAgent: req.get('User-Agent'),
      ip_address: req.ip
    };

    await storeRefreshToken(client, user.id, refreshToken, deviceInfo);

    await client.query('COMMIT');

    req.logger.info(`User registered: ${user.email}`);

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, verificationToken);

    // Set refresh token as httpOnly cookie for secure session persistence
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.toUpperCase() // Normalize role to uppercase for frontend compatibility
      },
      tokens: {
        accessToken,
        expiresIn: '15m'
        // refreshToken removed from JSON response - now in httpOnly cookie
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    req.logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  } finally {
    client.release();
  }
});

// Login user
router.post('/login', authLimiter, async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Invalid email or password',
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = value;

    // Get user from database
    const userQuery = `
      SELECT id, email, password_hash, "firstName", "lastName", role, "isActive", "isVerified", "lastLoginAt"
      FROM users 
      WHERE email = $1
    `;

    const userResult = await req.pool.query(userQuery, [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is suspended or inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const deviceInfo = {
      userAgent: req.get('User-Agent'),
      ip_address: req.ip
    };

    await storeRefreshToken(req.pool, user.id, refreshToken, deviceInfo);

    // Update last login
    await req.pool.query(
      'UPDATE users SET "lastLoginAt" = NOW() WHERE id = $1',
      [user.id]
    );

    req.logger.info(`User logged in: ${user.email}`);

    // Set refresh token as httpOnly cookie for secure session persistence
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.toUpperCase(), // Normalize role to uppercase for frontend compatibility
        emailVerified: user.isVerified
      },
      tokens: {
        accessToken,
        expiresIn: '15m'
        // refreshToken removed from JSON response - now in httpOnly cookie
      }
    });

  } catch (error) {
    req.logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Refresh access token
router.post('/refresh', generalLimiter, async (req, res) => {
  try {
    // Get refresh token from httpOnly cookie instead of request body
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token found',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Validate refresh token
    const session = await validateRefreshToken(req.pool, refreshToken);
    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new tokens
    const user = {
      id: session.user_id,
      email: session.email,
      "firstName": session.firstName,
      "lastName": session.lastName,
      role: session.role
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in database
    await req.pool.query(
      'UPDATE user_sessions SET token = $1 WHERE token = $2',
      [newRefreshToken, refreshToken]
    );

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    res.json({
      success: true,
      tokens: {
        accessToken,
        expiresIn: '15m'
        // refreshToken removed from JSON response - now in httpOnly cookie
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.toUpperCase()
      }
    });

  } catch (error) {
    req.logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

// Logout (revoke refresh token)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Get refresh token from httpOnly cookie instead of request body
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      await revokeRefreshToken(req.pool, refreshToken);
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    req.logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Logout from all devices
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    await revokeAllUserSessions(req.pool, req.user.id);

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });

  } catch (error) {
    req.logger.error('Logout all error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ALL_ERROR'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userQuery = `
      SELECT id, email, "firstName", "lastName", phone, role, "isActive", "isVerified", "createdAt", "lastLoginAt"
      FROM users 
      WHERE id = $1
    `;

    const userResult = await req.pool.query(userQuery, [req.user.id]);
    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.toUpperCase(), // Normalize role to uppercase for frontend compatibility
        "isActive": user.isActive,
        emailVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt
      }
    });

  } catch (error) {
    req.logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_ERROR'
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const updateSchema = Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().allow(null, '')
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (value.firstName !== undefined) {
      updates.push(`"firstName" = $${paramIndex++}`);
      values.push(value.firstName);
    }
    if (value.lastName !== undefined) {
      updates.push(`"lastName" = $${paramIndex++}`);
      values.push(value.lastName);
    }
    if (value.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(value.phone || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(req.user.id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, "firstName", "lastName", phone, role, "updatedAt"
    `;

    const result = await req.pool.query(query, values);
    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.toUpperCase(), // Normalize role to uppercase for frontend compatibility
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    req.logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

// Verify email
router.post('/verify-email', generalLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token required',
        code: 'MISSING_TOKEN'
      });
    }

    const userQuery = `
      UPDATE users 
      SET "isVerified" = TRUE, verification_token = NULL, "updatedAt" = NOW()
      WHERE verification_token = $1 AND "isVerified" = FALSE
      RETURNING id, email, "firstName", "lastName"
    `;

    const result = await req.pool.query(userQuery, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    const user = result.rows[0];
    req.logger.info(`Email verified for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    req.logger.error('Email verification error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Forgot password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Valid email required',
        code: 'VALIDATION_ERROR'
      });
    }

    const { email } = value;

    // Check if user exists
    const userQuery = 'SELECT id, email, "firstName" FROM users WHERE email = $1 AND "isActive" = $2';
    const userResult = await req.pool.query(userQuery, [email.toLowerCase(), true]);

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
    }

    const user = userResult.rows[0];
    const { token, expires } = generatePasswordResetToken();

    // Store reset token
    await req.pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    req.logger.info(`Password reset requested for: ${user.email}`);

    // TODO: Send password reset email
    // await sendPasswordResetEmail(user.email, user.firstName, token);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
    });

  } catch (error) {
    req.logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset request failed',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

// Reset password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Invalid token or password format',
        details: error.details.map(detail => detail.message)
      });
    }

    const { token, password } = value;

    // Find user with valid reset token
    const userQuery = `
      SELECT id, email 
      FROM users 
      WHERE reset_token = $1 AND reset_token_expires > NOW() AND "isActive" = true
    `;

    const userResult = await req.pool.query(userQuery, [token]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    const user = userResult.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await req.pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, "updatedAt" = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Revoke all existing sessions for security
    await revokeAllUserSessions(req.pool, user.id);

    req.logger.info(`Password reset completed for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });

  } catch (error) {
    req.logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

// Get user permissions
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Define role-based permissions
    const rolePermissions = {
      'CUSTOMER': [
        { resource: 'bookings', actions: ['create', 'read:own', 'update:own', 'cancel:own'] },
        { resource: 'profile', actions: ['read:own', 'update:own'] },
        { resource: 'quotes', actions: ['read:own', 'accept:own', 'reject:own'] },
        { resource: 'messages', actions: ['create', 'read:own'] },
        { resource: 'invoices', actions: ['read:own'] },
      ],
      'TECHNICIAN': [
        { resource: 'repairs', actions: ['read', 'update', 'complete'] },
        { resource: 'inventory', actions: ['read', 'request'] },
        { resource: 'customers', actions: ['read'] },
        { resource: 'messages', actions: ['create', 'read'] },
        { resource: 'schedule', actions: ['read:own', 'update:own'] },
      ],
      'ADMIN': [
        { resource: 'repairs', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'technicians', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'reports', actions: ['create', 'read'] },
        { resource: 'settings', actions: ['read', 'update'] },
        { resource: 'quotes', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'pricing', actions: ['create', 'read', 'update', 'delete'] },
      ],
      'SUPER_ADMIN': [
        { resource: '*', actions: ['*'] }, // Super admin has all permissions
      ],
    };

    const permissions = rolePermissions[userRole] || [];

    res.json({
      success: true,
      permissions,
      role: userRole
    });

  } catch (error) {
    req.logger.error('Get permissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch permissions',
      code: 'PERMISSIONS_ERROR'
    });
  }
});

// Validate access token
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    // Token is already validated by authenticateToken middleware
    // Get fresh user data from database
    const userQuery = `
      SELECT id, email, "firstName", "lastName", role, "isActive", "isVerified", "lastLoginAt"
      FROM users 
      WHERE id = $1 AND "isActive" = true
    `;

    const userResult = await req.pool.query(userQuery, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.toUpperCase(), // Normalize role to uppercase for frontend compatibility
        emailVerified: user.isVerified,
        lastLogin: user.lastLoginAt
      }
    });

  } catch (error) {
    req.logger.error('Token validation error:', error);
    res.status(401).json({
      error: 'Token validation failed',
      code: 'VALIDATION_ERROR',
      valid: false
    });
  }
});

// Simple validation route (no auth required for testing)
router.get('/validate-simple', (req, res) => {
  res.json({
    message: 'Validate route working',
    timestamp: new Date().toISOString(),
    success: true
  });
});

// Test route for debugging  
router.get('/test-permissions', (req, res) => {
  res.json({
    message: 'Test route working',
    timestamp: new Date().toISOString()
  });
});

// Get user permissions
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Define role-based permissions
    const rolePermissions = {
      'CUSTOMER': [
        { resource: 'bookings', actions: ['create', 'read:own', 'update:own', 'cancel:own'] },
        { resource: 'profile', actions: ['read:own', 'update:own'] },
        { resource: 'quotes', actions: ['read:own', 'accept:own', 'reject:own'] },
        { resource: 'messages', actions: ['create', 'read:own'] },
        { resource: 'invoices', actions: ['read:own'] },
      ],
      'TECHNICIAN': [
        { resource: 'repairs', actions: ['read', 'update', 'complete'] },
        { resource: 'inventory', actions: ['read', 'request'] },
        { resource: 'customers', actions: ['read'] },
        { resource: 'messages', actions: ['create', 'read'] },
        { resource: 'schedule', actions: ['read:own', 'update:own'] },
      ],
      'ADMIN': [
        { resource: 'repairs', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'technicians', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'reports', actions: ['create', 'read'] },
        { resource: 'settings', actions: ['read', 'update'] },
        { resource: 'quotes', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'pricing', actions: ['create', 'read', 'update', 'delete'] },
      ],
      'SUPER_ADMIN': [
        { resource: '*', actions: ['*'] }, // Super admin has all permissions
      ],
    };

    const permissions = rolePermissions[userRole] || [];

    res.json({
      success: true,
      permissions,
      role: userRole
    });

  } catch (error) {
    req.logger.error('Get permissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch permissions',
      code: 'PERMISSIONS_ERROR'
    });
  }
});

// Validate access token
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    // Token is already validated by authenticateToken middleware
    // Get fresh user data from database
    const userQuery = `
      SELECT id, email, "firstName", "lastName", role, "isActive", "isVerified", "lastLoginAt"
      FROM users 
      WHERE id = $1 AND "isActive" = true
    `;

    const userResult = await req.pool.query(userQuery, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.toUpperCase(), // Normalize role to uppercase for frontend compatibility
        emailVerified: user.isVerified,
        lastLogin: user.lastLoginAt
      }
    });

  } catch (error) {
    req.logger.error('Token validation error:', error);
    res.status(401).json({
      error: 'Token validation failed',
      code: 'VALIDATION_ERROR',
      valid: false
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    "isActive": 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;