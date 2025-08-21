/**
 * Development Analytics Routes
 * No authentication required - for development testing only
 */

const express = require('express');
const router = express.Router();

console.log('🧪 DEV: Analytics development router loaded');

// POST /api/dev/analytics/events - Development analytics events endpoint
router.post('/events', (req, res) => {
  try {
    console.log('📊 DEV: Analytics event received:', req.body);
    
    // In development, just log and return success
    res.json({
      success: true,
      message: 'Analytics event received (development mode)',
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