import express from 'express';
const router = express.Router();

// Basic health check endpoint
router.get('/', (req, res) => {
  const healthcheck = {
    success: true,
    message: 'RevivaTech API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    server: {
      status: 'operational',
      port: process.env.PORT || 3011,
      nodeVersion: process.version,
    },
    services: {
      database: 'pending', // Will be updated when database is connected
      redis: 'pending',    // Will be updated when Redis is connected
      auth: 'operational',
      api: 'operational',
    }
  };

  res.status(200).json(healthcheck);
});

// Detailed system status
router.get('/status', (req, res) => {
  const status = {
    success: true,
    system: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        process: process.uptime(),
        system: require('os').uptime(),
      },
      memory: {
        used: process.memoryUsage(),
        free: require('os').freemem(),
        total: require('os').totalmem(),
      },
      cpu: {
        usage: process.cpuUsage(),
        model: require('os').cpus()[0]?.model,
        cores: require('os').cpus().length,
      },
    },
    services: {
      api: {
        status: 'operational',
        version: '1.0.0',
        endpoints: [
          'GET /api/health',
          'POST /api/auth/login',
          'GET /api/devices',
          'POST /api/bookings',
          'GET /api/customers',
        ]
      },
      database: {
        status: 'pending',
        type: 'PostgreSQL',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5435,
      },
      redis: {
        status: 'pending',
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6383,
      },
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    }
  };

  res.status(200).json(status);
});

// Ready endpoint for container orchestration
router.get('/ready', (req, res) => {
  // Check if all critical services are ready
  const ready = {
    success: true,
    ready: true,
    message: 'Service is ready to accept requests',
    timestamp: new Date().toISOString(),
    checks: {
      server: true,
      environment: !!process.env.JWT_SECRET,
      // database: false,  // Will be enabled when DB is connected
      // redis: false,     // Will be enabled when Redis is connected
    }
  };

  const allReady = Object.values(ready.checks).every(Boolean);
  
  if (!allReady) {
    ready.success = false;
    ready.ready = false;
    ready.message = 'Service is not ready';
    return res.status(503).json(ready);
  }

  res.status(200).json(ready);
});

// Live endpoint for container orchestration
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    alive: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime(),
  });
});

export default router;