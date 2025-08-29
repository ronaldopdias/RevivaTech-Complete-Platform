const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// Test endpoint to verify Prisma connection
router.get('/health', async (req, res) => {
  try {
    // Test database connection with Prisma
    const result = await prisma.$queryRaw`SELECT 1 as status, NOW() as timestamp`;
    
    res.json({
      status: 'healthy',
      service: 'prisma-test',
      database: 'connected',
      timestamp: new Date().toISOString(),
      dbResult: result[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'prisma-test',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Get user count using Prisma
router.get('/users/count', async (req, res) => {
  try {
    const count = await prisma.user.count();
    
    res.json({
      success: true,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all users using Prisma (for testing)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      take: 10
    });
    
    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;