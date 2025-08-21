/**
 * Better Auth Test Routes
 * Created for development testing and validation
 * Based on completion report specifications
 */

const express = require('express');
const { authenticateBetterAuth, requireRole, requireAdmin } = require('../middleware/better-auth');

const router = express.Router();

/**
 * Debug endpoint for testing cookie parsing and authentication
 */
router.get('/debug', (req, res) => {
  res.json({
    message: 'Better Auth debug endpoint',
    cookies: req.cookies || {},
    headers: {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Protected endpoint requiring authentication
 */
router.get('/protected', authenticateBetterAuth, (req, res) => {
  res.json({
    message: 'Protected endpoint accessed successfully',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

/**
 * Admin endpoint requiring admin role
 */
router.get('/admin', authenticateBetterAuth, requireAdmin, (req, res) => {
  res.json({
    message: 'Admin endpoint accessed successfully', 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;