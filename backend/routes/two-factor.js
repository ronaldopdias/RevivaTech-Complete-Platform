/**
 * Enhanced Two-Factor Authentication API Routes
 * Provides comprehensive 2FA management for users
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth: authenticateToken } = require('../lib/auth-utils');
const twoFactorService = require('../lib/two-factor-service');

const router = express.Router();

// Apply authentication to all 2FA routes
router.use(authenticateToken);

/**
 * GET /api/two-factor/status - Check 2FA status for current user
 */
router.get('/status', async (req, res) => {
  try {
    const status = await twoFactorService.is2FAEnabled(req.user.id);
    
    res.json({
      success: true,
      data: {
        enabled: status.enabled,
        backupCodesRemaining: status.backupCodesRemaining,
        lowBackupCodesWarning: status.backupCodesRemaining <= 3 && status.backupCodesRemaining > 0
      }
    });
  } catch (error) {
    console.error('2FA Status Check Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check 2FA status',
      message: error.message
    });
  }
});

/**
 * POST /api/two-factor/setup - Generate TOTP secret and QR code
 */
router.post('/setup', async (req, res) => {
  try {
    // Check if 2FA is already enabled
    const currentStatus = await twoFactorService.is2FAEnabled(req.user.id);
    if (currentStatus.enabled) {
      return res.status(400).json({
        success: false,
        error: '2FA already enabled',
        message: 'Two-factor authentication is already enabled for this account'
      });
    }

    const setup = await twoFactorService.generateTOTPSetup(req.user.id, req.user.email);
    
    res.json({
      success: true,
      data: {
        qrCode: setup.qrCode,
        manualEntryKey: setup.manualEntryKey,
        instructions: {
          step1: 'Install an authenticator app (Google Authenticator, Authy, etc.)',
          step2: 'Scan the QR code or manually enter the key',
          step3: 'Enter the 6-digit code from your app to verify setup'
        }
      },
      message: 'TOTP setup generated. Complete verification to enable 2FA.'
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup 2FA',
      message: error.message
    });
  }
});

/**
 * POST /api/two-factor/verify - Verify TOTP token and enable 2FA
 */
router.post('/verify', [
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Token must be a 6-digit number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token } = req.body;
    const result = await twoFactorService.verifyAndEnableTOTP(req.user.id, token);
    
    res.json({
      success: true,
      data: {
        backupCodes: result.backupCodes,
        backupCodesWarning: 'Save these backup codes in a secure location. They can only be used once each and will not be shown again.'
      },
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error) {
    console.error('2FA Verification Error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to verify 2FA',
      message: error.message
    });
  }
});

/**
 * POST /api/two-factor/authenticate - Verify 2FA token for authentication
 */
router.post('/authenticate', [
  body('token')
    .isLength({ min: 6, max: 8 })
    .withMessage('Token must be 6-8 characters (TOTP or backup code)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token } = req.body;
    const result = await twoFactorService.verifyTOTP(req.user.id, token);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid 2FA token',
        message: 'The provided token is invalid or expired'
      });
    }

    const responseData = { verified: true };
    
    // Add backup code warnings if applicable
    if (result.remainingBackupCodes !== undefined) {
      responseData.backupCodeUsed = true;
      responseData.remainingBackupCodes = result.remainingBackupCodes;
      
      if (result.lowCodeWarning) {
        responseData.warning = 'You have 3 or fewer backup codes remaining. Consider regenerating new ones.';
      }
    }
    
    res.json({
      success: true,
      data: responseData,
      message: result.backupCodeUsed ? 'Backup code verified successfully' : '2FA token verified successfully'
    });
  } catch (error) {
    console.error('2FA Authentication Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate 2FA',
      message: error.message
    });
  }
});

/**
 * POST /api/two-factor/backup-codes/regenerate - Generate new backup codes
 */
router.post('/backup-codes/regenerate', async (req, res) => {
  try {
    // Verify 2FA is enabled
    const status = await twoFactorService.is2FAEnabled(req.user.id);
    if (!status.enabled) {
      return res.status(400).json({
        success: false,
        error: '2FA not enabled',
        message: 'Two-factor authentication must be enabled to regenerate backup codes'
      });
    }

    const result = await twoFactorService.regenerateBackupCodes(req.user.id);
    
    res.json({
      success: true,
      data: {
        backupCodes: result.backupCodes,
        warning: 'Your old backup codes are now invalid. Save these new codes in a secure location.'
      },
      message: 'Backup codes regenerated successfully'
    });
  } catch (error) {
    console.error('Backup Codes Regeneration Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate backup codes',
      message: error.message
    });
  }
});

/**
 * DELETE /api/two-factor/disable - Disable 2FA for current user
 */
router.delete('/disable', [
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required to disable 2FA'),
  body('token')
    .optional()
    .isLength({ min: 6, max: 8 })
    .withMessage('If provided, token must be 6-8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { confirmPassword, token } = req.body;
    
    // TODO: Verify password against user's current password
    // This would require access to password verification method
    
    // If 2FA is enabled and no token provided, require it
    const status = await twoFactorService.is2FAEnabled(req.user.id);
    if (status.enabled && !token) {
      return res.status(400).json({
        success: false,
        error: 'Token required',
        message: 'A 2FA token is required to disable two-factor authentication'
      });
    }

    // Verify 2FA token if provided
    if (token) {
      const tokenResult = await twoFactorService.verifyTOTP(req.user.id, token);
      if (!tokenResult.success) {
        return res.status(401).json({
          success: false,
          error: 'Invalid 2FA token',
          message: 'The provided 2FA token is invalid'
        });
      }
    }

    await twoFactorService.disable2FA(req.user.id);
    
    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('2FA Disable Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA',
      message: error.message
    });
  }
});

module.exports = router;