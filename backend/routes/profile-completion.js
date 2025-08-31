/**
 * Profile Completion Routes
 * Handles progressive registration for Google OAuth users
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// PostgreSQL connection (reuse from main server)
const pool = new Pool({
  user: process.env.DB_USER || 'revivatech',
  host: process.env.DB_HOST || 'revivatech_database',
  database: process.env.DB_NAME || 'revivatech',
  password: process.env.DB_PASSWORD || 'revivatech_password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * GET /api/profile-completion/status
 * Check if user needs to complete their profile
 */
router.get('/status', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user registration status from database
    const result = await pool.query(
      `SELECT "registrationStatus", "profileCompletedAt", phone 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const needsCompletion = user.registrationStatus === 'PENDING_PROFILE_COMPLETION';

    res.json({
      success: true,
      needsCompletion,
      registrationStatus: user.registrationStatus,
      profileCompletedAt: user.profileCompletedAt,
      hasPhone: !!user.phone
    });

  } catch (error) {
    console.error('Profile completion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check profile completion status'
    });
  }
});

/**
 * GET /api/profile-completion/user-data/:userId
 * Get user data for pre-filling profile completion form
 */
router.get('/user-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user data for pre-filling form
    const result = await pool.query(
      `SELECT id, email, "firstName", "lastName", phone, "profilePicture", locale, "googleId"
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        profilePicture: user.profilePicture,
        locale: user.locale,
        isGoogleUser: !!user.googleId
      }
    });

  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

/**
 * POST /api/profile-completion/complete
 * Complete user profile with additional information
 */
router.post('/complete', async (req, res) => {
  try {
    const { userId, firstName, lastName, phone, email } = req.body;

    // Validation
    if (!userId || !firstName || !lastName || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required (userId, firstName, lastName, phone, email)'
      });
    }

    // Phone number validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if user exists and is pending completion
    const userResult = await pool.query(
      `SELECT "registrationStatus" FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentStatus = userResult.rows[0].registrationStatus;
    if (currentStatus === 'COMPLETE') {
      return res.status(400).json({
        success: false,
        error: 'Profile is already complete'
      });
    }

    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email is already in use by another account'
      });
    }

    // Update user profile
    const updateResult = await pool.query(
      `UPDATE users 
       SET "firstName" = $2, 
           "lastName" = $3, 
           phone = $4, 
           email = $5,
           "registrationStatus" = 'COMPLETE',
           "profileCompletedAt" = CURRENT_TIMESTAMP,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, "firstName", "lastName", phone, "registrationStatus", "profileCompletedAt"`,
      [userId, firstName, lastName, phone, email]
    );

    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }

    const updatedUser = updateResult.rows[0];

    // Log successful completion
    console.log('✅ Profile completion successful:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      completedAt: updatedUser.profileCompletedAt
    });

    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        registrationStatus: updatedUser.registrationStatus,
        profileCompletedAt: updatedUser.profileCompletedAt
      }
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/profile-completion/skip
 * Allow user to skip profile completion (for testing/admin purposes)
 */
router.post('/skip', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Mark as complete without additional data
    const result = await pool.query(
      `UPDATE users 
       SET "registrationStatus" = 'COMPLETE',
           "profileCompletedAt" = CURRENT_TIMESTAMP,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $1 AND "registrationStatus" = 'PENDING_PROFILE_COMPLETION'
       RETURNING id, "registrationStatus"`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User not found or profile already complete'
      });
    }

    console.log('⚠️ Profile completion skipped for user:', userId);

    res.json({
      success: true,
      message: 'Profile completion skipped',
      registrationStatus: 'COMPLETE'
    });

  } catch (error) {
    console.error('Profile completion skip error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to skip profile completion'
    });
  }
});

module.exports = router;