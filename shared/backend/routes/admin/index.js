/**
 * RevivaTech Admin Routes Index
 * Main entry point for all admin API routes
 */

const express = require('express');
const router = express.Router();

// Import admin route modules
const proceduresRoutes = require('./procedures');
const mediaRoutes = require('./media');
const analyticsRoutes = require('./analytics');
const usersRoutes = require('./users');

// Import authentication middleware
const { authenticateToken, requireAdmin } = require('../../middleware/authentication');

// Debug authentication middleware to understand what's happening
const debugAuth = (req, res, next) => {
    console.log(`🔍 DEBUG: Admin route hit - ${req.method} ${req.originalUrl}`);
    console.log(`🔍 DEBUG: Auth header:`, req.headers.authorization ? 'Present' : 'Missing');
    console.log(`🔍 DEBUG: req.user before auth:`, req.user ? 'Present' : 'Missing');
    next();
};

const debugAfterAuth = (req, res, next) => {
    console.log(`🔍 DEBUG: After authenticateToken - req.user:`, req.user ? `${req.user.email} (${req.user.role})` : 'Still missing');
    next();
};

const debugAfterRoleCheck = (req, res, next) => {
    console.log(`🔍 DEBUG: After requireAdmin - req.user:`, req.user ? `${req.user.email} (${req.user.role})` : 'Still missing');
    console.log(`🔐 Admin API Access: ${req.method} ${req.originalUrl} - User: ${req.user ? req.user.email : 'UNAUTHENTICATED'} (${req.user ? req.user.role : 'NO_ROLE'})`);
    next();
};

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);
router.use((req, res, next) => {
    console.log(`✅ Admin authenticated: ${req.user.email} (${req.user.role})`);
    next();
});

// Mount admin route modules
router.use('/procedures', proceduresRoutes);
router.use('/media', mediaRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', usersRoutes);

// Admin dashboard overview endpoint
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'RevivaTech Admin API',
            version: '1.0.0',
            endpoints: {
                procedures: {
                    base: '/api/admin/procedures',
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    description: 'Repair procedures CRUD operations'
                },
                media: {
                    base: '/api/admin/media',
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    description: 'Media file upload and management'
                },
                analytics: {
                    base: '/api/admin/analytics',
                    methods: ['GET', 'POST'],
                    description: 'Dashboard analytics and ML metrics'
                },
                users: {
                    base: '/api/admin/users',
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    description: 'User management and administration'
                }
            },
            features: {
                procedures: {
                    crud_operations: true,
                    search_filtering: true,
                    status_management: true,
                    statistics: true
                },
                media: {
                    file_upload: true,
                    thumbnail_generation: true,
                    file_serving: true,
                    metadata_management: true
                },
                analytics: {
                    dashboard_metrics: true,
                    ml_integration: true,
                    system_health: true,
                    user_interactions: true
                },
                users: {
                    role_management: true,
                    session_control: true,
                    email_verification: true,
                    password_reset: true
                }
            },
            database: {
                tables_created: [
                    'repair_procedures',
                    'media_files',
                    'ml_model_metrics',
                    'ml_training_data',
                    'user_interaction_analytics',
                    'analytics_aggregations',
                    'system_performance_logs'
                ],
                indexes_optimized: true,
                phase4_integration: true
            },
            server_info: {
                node_version: process.version,
                uptime: process.uptime(),
                memory_usage: process.memoryUsage(),
                environment: process.env.NODE_ENV || 'development'
            },
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error in admin overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load admin overview',
            details: error.message
        });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const { Pool } = require('pg');
        
        const pool = new Pool({
            user: process.env.DB_USER || 'revivatech_user',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'revivatech_new',
            password: process.env.DB_PASSWORD || 'secure_password_2024',
            port: process.env.DB_PORT || 5435,
        });

        // Test database connection
        const dbResult = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
        
        res.json({
            success: true,
            status: 'healthy',
            checks: {
                database: {
                    status: 'connected',
                    current_time: dbResult.rows[0].current_time,
                    user_count: dbResult.rows[0].user_count
                },
                server: {
                    status: 'running',
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Health check failed:', error);
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware for admin routes
router.use((error, req, res, next) => {
    console.error('❌ Admin API Error:', error);
    
    // Handle specific error types
    if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({
            success: false,
            error: 'Duplicate entry',
            details: 'A record with this data already exists'
        });
    }
    
    if (error.code === '23503') { // PostgreSQL foreign key violation
        return res.status(400).json({
            success: false,
            error: 'Invalid reference',
            details: 'Referenced record does not exist'
        });
    }
    
    if (error.code === '23502') { // PostgreSQL not null violation
        return res.status(400).json({
            success: false,
            error: 'Missing required field',
            details: 'A required field was not provided'
        });
    }
    
    // Generic error response
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;