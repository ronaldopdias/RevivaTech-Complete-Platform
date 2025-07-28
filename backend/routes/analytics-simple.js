const express = require('express');
const router = express.Router();

console.log('🚀 Analytics-simple router loaded');

// Simple test route to verify routing works
router.get('/simple-test', (req, res) => {
  console.log('🎯 Simple test route hit');
  res.json({ 
    success: true, 
    message: 'Simple analytics test route works',
    timestamp: new Date().toISOString()
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      analytics: 'operational'
    }
  });
});

// Revenue route (without auth for testing)
router.get('/revenue', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        total: 15420.50,
        growth: 12.5,
        trend: 'up'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Performance route (without auth for testing)
router.get('/performance', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        bookings: 1247,
        completion: 94.2,
        avgTime: 2.5
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customers route (without auth for testing)
router.get('/customers', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        total: 2847,
        new: 45,
        returning: 78
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;