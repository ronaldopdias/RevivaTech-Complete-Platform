const express = require('express');
const router = express.Router();
const { prisma, testConnection } = require('../lib/prisma');
const redisClient = require('../config/redis');

// Main health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Backend API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  });
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as status`;
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      message: `Database connected via Prisma (${responseTime}ms)`,
      responseTime,
      details: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'revivatech',
        adapter: 'Prisma',
        connectionType: 'Connection Pool'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Redis health check
router.get('/redis', async (req, res) => {
  try {
    const startTime = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - startTime;
    
    const info = await redisClient.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    const uptimeMatch = info.match(/uptime_in_seconds:([^\r\n]+)/);
    
    res.json({
      status: 'healthy',
      message: `Redis connected (${responseTime}ms)`,
      responseTime,
      details: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        version: versionMatch ? versionMatch[1] : 'unknown',
        uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : 0
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Redis connection failed',
      error: error.message
    });
  }
});

// Combined health check
router.get('/all', async (req, res) => {
  const checks = [];
  
  // Check API
  checks.push({
    service: 'API',
    status: 'healthy',
    message: 'Operational'
  });
  
  // Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      service: 'Database (Prisma)',
      status: 'healthy',
      message: 'Connected'
    });
  } catch (error) {
    checks.push({
      service: 'Database (Prisma)',
      status: 'unhealthy',
      message: error.message
    });
  }
  
  // Check Redis
  try {
    await redisClient.ping();
    checks.push({
      service: 'Redis',
      status: 'healthy',
      message: 'Connected'
    });
  } catch (error) {
    checks.push({
      service: 'Redis',
      status: 'unhealthy',
      message: error.message
    });
  }
  
  const allHealthy = checks.every(c => c.status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;