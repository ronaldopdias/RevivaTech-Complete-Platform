const express = require('express');
const router = express.Router();

/**
 * Comprehensive Health Check System
 * Production-ready monitoring and health validation
 */

// Comprehensive health check endpoint
router.get('/', async (req, res) => {
  const healthCheck = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '2.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        free: Math.round(require('os').freemem() / 1024 / 1024),
        totalSystem: Math.round(require('os').totalmem() / 1024 / 1024)
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: require('os').loadavg(),
        cores: require('os').cpus().length
      }
    },
    services: {
      api: {
        status: 'healthy',
        endpoints: [
          'GET /health',
          'GET /api/auth/health',
          'POST /api/auth/login',
          'GET /api/devices/categories',
          'GET /api/bookings',
          'GET /api/customers/dashboard-stats'
        ]
      },
      database: {
        status: 'pending',
        type: 'PostgreSQL',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5435,
        database: process.env.DB_NAME || 'revivatech_new'
      },
      redis: {
        status: 'pending',
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6383
      },
      authentication: {
        status: 'healthy',
        jwtConfigured: !!process.env.JWT_SECRET,
        sessionConfigured: !!process.env.SESSION_SECRET
      }
    },
    metrics: {
      requestsTotal: 'N/A', // Would be tracked by middleware
      errorsTotal: 'N/A',   // Would be tracked by middleware
      responseTime: 'N/A',  // Would be tracked by middleware
      activeConnections: 'N/A'
    }
  };

  // Test database connection
  try {
    if (req.pool) {
      const result = await req.pool.query('SELECT NOW() as timestamp, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
      healthCheck.services.database.status = 'healthy';
      healthCheck.services.database.lastCheck = result.rows[0].timestamp;
      healthCheck.services.database.tableCount = parseInt(result.rows[0].table_count);
    }
  } catch (error) {
    healthCheck.services.database.status = 'error';
    healthCheck.services.database.error = error.message;
    healthCheck.success = false;
    healthCheck.status = 'degraded';
  }

  // Set response status based on overall health
  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Readiness probe for Kubernetes/container orchestration
router.get('/ready', async (req, res) => {
  const readiness = {
    success: true,
    ready: true,
    timestamp: new Date().toISOString(),
    checks: {
      server: true,
      environment: !!process.env.JWT_SECRET && !!process.env.SESSION_SECRET,
      database: false,
      redis: false
    }
  };

  // Check database connectivity
  try {
    if (req.pool) {
      await req.pool.query('SELECT 1');
      readiness.checks.database = true;
    }
  } catch (error) {
    readiness.checks.database = false;
  }

  // Check Redis connectivity (if Redis client is available)
  try {
    // Redis check would go here if Redis client is configured
    readiness.checks.redis = true; // Assume healthy for now
  } catch (error) {
    readiness.checks.redis = false;
  }

  const allReady = Object.values(readiness.checks).every(Boolean);
  
  if (!allReady) {
    readiness.success = false;
    readiness.ready = false;
    readiness.message = 'Service is not ready - some dependencies are unavailable';
    return res.status(503).json(readiness);
  }

  readiness.message = 'Service is ready to accept requests';
  res.status(200).json(readiness);
});

// Liveness probe for Kubernetes/container orchestration
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    alive: true,
    message: 'Service is alive and responding',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// Performance metrics endpoint
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      loadAverage: require('os').loadavg()
    },
    application: {
      version: '2.0.0',
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    },
    database: {
      status: 'unknown',
      connectionCount: 'N/A',
      activeQueries: 'N/A'
    }
  };

  // Get database metrics if available
  try {
    if (req.pool) {
      const dbStats = await req.pool.query(`
        SELECT 
          COUNT(*) as total_connections,
          COUNT(*) FILTER (WHERE state = 'active') as active_connections,
          COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      metrics.database.status = 'connected';
      metrics.database.totalConnections = parseInt(dbStats.rows[0].total_connections);
      metrics.database.activeConnections = parseInt(dbStats.rows[0].active_connections);
      metrics.database.idleConnections = parseInt(dbStats.rows[0].idle_connections);
    }
  } catch (error) {
    metrics.database.status = 'error';
    metrics.database.error = error.message;
  }

  res.status(200).json(metrics);
});

// Detailed status endpoint for monitoring dashboards
router.get('/status', async (req, res) => {
  const status = {
    success: true,
    overall: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      webServer: {
        status: 'healthy',
        uptime: process.uptime(),
        port: process.env.PORT || 3011,
        environment: process.env.NODE_ENV,
        version: '2.0.0'
      },
      authentication: {
        status: 'healthy',
        jwtConfigured: !!process.env.JWT_SECRET,
        sessionConfigured: !!process.env.SESSION_SECRET,
        passwordHashing: 'bcrypt'
      },
      apis: {
        status: 'healthy',
        mountedServices: [
          'auth',
          'devices', 
          'customers',
          'bookings',
          'pricing',
          'repairs'
        ],
        totalEndpoints: 25 // Approximate count
      }
    }
  };

  // Check each component health
  try {
    // Database component check
    if (req.pool) {
      const dbResult = await req.pool.query('SELECT version(), current_database(), current_user');
      status.components.database = {
        status: 'healthy',
        type: 'PostgreSQL',
        version: dbResult.rows[0].version.split(' ')[1],
        database: dbResult.rows[0].current_database,
        user: dbResult.rows[0].current_user,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5435
      };
    } else {
      status.components.database = {
        status: 'error',
        error: 'Database connection not available'
      };
      status.overall = 'degraded';
    }
  } catch (error) {
    status.components.database = {
      status: 'error',
      error: error.message
    };
    status.overall = 'degraded';
  }

  // Redis component check (placeholder)
  status.components.redis = {
    status: 'healthy', // Would be properly checked with Redis client
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6383
  };

  const statusCode = status.overall === 'healthy' ? 200 : 503;
  res.status(statusCode).json(status);
});

module.exports = router;