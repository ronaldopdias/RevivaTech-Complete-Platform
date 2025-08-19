/**
 * Authentication Test Routes
 * Test the new HTTP authentication client
 */

const express = require('express');
const { validateSession, authenticateMiddleware } = require('../lib/auth-client');
const router = express.Router();

// Test session validation
router.get('/validate', async (req, res) => {
  try {
    const sessionData = await validateSession(req.headers);
    
    res.json({
      success: true,
      hasSession: !!sessionData,
      sessionData: sessionData || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Test protected route
router.get('/protected', authenticateMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route accessed successfully',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Test public route
router.get('/public', (req, res) => {
  res.json({
    success: true,
    message: 'Public route - no authentication required',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;