const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const crypto = require('crypto');

// Import Prisma client
const { prisma, executeTransaction } = require('../lib/prisma');

// Import authentication utilities
const {
  requireAuth: authenticateToken,
  optionalAuth
} = require('../lib/auth-utils');

// JWT-specific functions that are deprecated with Better Auth
// These are stubs for compatibility - Better Auth handles these internally
const storeRefreshToken = async () => console.warn('storeRefreshToken deprecated - Better Auth handles sessions');
const validateRefreshToken = async () => console.warn('validateRefreshToken deprecated - Better Auth handles sessions');
const revokeRefreshToken = async () => console.warn('revokeRefreshToken deprecated - Better Auth handles sessions');
const revokeAllUserSessions = async () => console.warn('revokeAllUserSessions deprecated - Better Auth handles sessions');
const generateVerificationToken = () => console.warn('generateVerificationToken deprecated - Better Auth handles verification');
const generatePasswordResetToken = () => console.warn('generatePasswordResetToken deprecated - Better Auth handles password reset');

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

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

// Register new user
router.post('/register', authLimiter, async (req, res) => {
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

    // Check if user already exists using Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
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
    const userId = crypto.randomBytes(12).toString('base64url');
    const accountId = crypto.randomBytes(12).toString('base64url');

    // Create user and account in a transaction using Prisma
    const result = await executeTransaction(async (tx) => {
      // Create user (without password_hash - that goes in account table)
      const user = await tx.user.create({
        data: {
          id: userId,
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone: phone || null,
          role: 'CUSTOMER',
          emailVerified: false,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        }
      });

      // Create account record with password (Better Auth pattern)
      await tx.account.create({
        data: {
          id: accountId,
          accountId: email.toLowerCase(),
          providerId: 'credential',
          userId: userId,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return user;
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(result);

    // Store refresh token
    const deviceInfo = {
      userAgent: req.get('User-Agent'),
      ip_address: req.ip
    };

    await storeRefreshToken(prisma, result.id, refreshToken, deviceInfo);

    req.logger.info(`User registered: ${result.email}`);

    // TODO: Send verification email
    // await sendVerificationEmail(result.email, verificationToken);

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
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role.toUpperCase()
      },
      tokens: {
        accessToken,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    req.logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
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

    // Get user from database using Prisma
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        account: {
          where: { providerId: 'credential' },
          select: { password: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is suspended or inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if user has credential account
    if (!user.account || user.account.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.account[0].password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    const { accessToken, refreshToken } = generateTokens(userData);

    // Store refresh token
    const deviceInfo = {
      userAgent: req.get('User-Agent'),
      ip_address: req.ip
    };

    await storeRefreshToken(prisma, user.id, refreshToken, deviceInfo);

    // Update last login using Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

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
        role: user.role.toUpperCase(),
        emailVerified: user.emailVerified
      },
      tokens: {
        accessToken,
        expiresIn: '15m'
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
    const session = await validateRefreshToken(prisma, refreshToken);
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
      firstName: session.firstName,
      lastName: session.lastName,
      role: session.role
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in database using Prisma
    await prisma.session.update({
      where: { token: refreshToken },
      data: { 
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

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
      await revokeRefreshToken(prisma, refreshToken);
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
    await revokeAllUserSessions(prisma, req.user.id);

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
    // Get user using Prisma
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.toUpperCase(),
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLogin: user.updatedAt
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

    // Build update data object
    const updateData = {
      updatedAt: new Date()
    };

    if (value.firstName !== undefined) {
      updateData.firstName = value.firstName;
    }
    if (value.lastName !== undefined) {
      updateData.lastName = value.lastName;
    }
    if (value.phone !== undefined) {
      updateData.phone = value.phone || null;
    }

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    // Update user using Prisma
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.toUpperCase(),
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

    // Update user email verification using Prisma
    const user = await prisma.user.updateMany({
      where: {
        verification_token: token,
        emailVerified: false
      },
      data: {
        emailVerified: true,
        verification_token: null,
        updatedAt: new Date()
      }
    });

    if (user.count === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    // Get the updated user details
    const updatedUser = await prisma.user.findFirst({
      where: { emailVerified: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    req.logger.info(`Email verified for user: ${updatedUser.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
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

    // Check if user exists using Prisma
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true
      }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
    }

    const { token, expires } = generatePasswordResetToken();

    // Store reset token using Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: token,
        reset_token_expires: expires
      }
    });

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

    // Find user with valid reset token using Prisma
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gt: new Date() },
        isActive: true
      },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token in transaction
    await executeTransaction(async (tx) => {
      // Update password in account table
      await tx.account.updateMany({
        where: {
          userId: user.id,
          providerId: 'credential'
        },
        data: {
          password: passwordHash,
          updatedAt: new Date()
        }
      });

      // Clear reset token
      await tx.user.update({
        where: { id: user.id },
        data: {
          reset_token: null,
          reset_token_expires: null,
          updatedAt: new Date()
        }
      });
    });

    // Revoke all existing sessions for security
    await revokeAllUserSessions(prisma, user.id);

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
    // Get fresh user data from database using Prisma
    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.toUpperCase(),
        emailVerified: user.emailVerified,
        lastLogin: user.updatedAt
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

// Health check
router.get('/health', (req, res) => {
  res.json({
    isActive: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;