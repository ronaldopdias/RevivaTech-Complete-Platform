/**
 * Development Analytics Routes
 * No authentication required - for development testing only
 */

const express = require('express');
const router = express.Router();


// POST /api/dev/analytics/events - Development analytics events endpoint
router.post('/events', (req, res) => {
  try {
    // Simplified dev endpoint - main analytics now handles all requests
    res.json({
      success: true,
      message: 'Analytics event received (development mode - redirected to main endpoint)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ DEV: Analytics event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process analytics event',
      details: error.message
    });
  }
});

// GET /api/dev/analytics/health - Development health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy (development)',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

module.exports = router;