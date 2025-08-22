const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Minimal analytics test works',
    timestamp: new Date().toISOString()
  });
});

// Health route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = { router };