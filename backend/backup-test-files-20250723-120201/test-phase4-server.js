/**
 * RevivaTech Phase 4 Test Server
 * Advanced AI Features & Admin Interface
 * Machine Learning Enhanced Knowledge Base
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3015; // Phase 4 dedicated port

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased for media uploads
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // Increased for admin features
    message: {
        error: true,
        message: 'Too many requests, please try again later.',
        phase: '4_rate_limited'
    }
});
app.use('/api/', limiter);

// Import Phase 4 routes
try {
    const aiAdvancedRoutes = require('./routes/ai-advanced');
    app.use('/api/ai-advanced', aiAdvancedRoutes);
    console.log('✅ AI Advanced routes loaded');
} catch (error) {
    console.log('⚠️  AI Advanced routes not available:', error.message);
}

try {
    const adminRoutes = require('./routes/admin-interface');
    app.use('/api/admin', adminRoutes);
    console.log('✅ Admin routes loaded');
} catch (error) {
    console.log('⚠️  Admin routes not yet implemented:', error.message);
}

try {
    const mlRoutes = require('./routes/ml-recommendations');
    app.use('/api/ml', mlRoutes);
    console.log('✅ ML routes loaded');
} catch (error) {
    console.log('⚠️  ML routes not yet implemented:', error.message);
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'RevivaTech AI Chatbot Phase 4',
        version: '4.0.0',
        description: 'Advanced AI Features with Machine Learning & Admin Interface',
        phase: '4_advanced_ai',
        features: {
            ml_recommendations: 'Machine learning enhanced procedure recommendations',
            admin_interface: 'Content management dashboard for procedures',
            multimedia_content: 'Video tutorials and interactive diagrams',
            advanced_analytics: 'Real-time performance monitoring and insights',
            semantic_search: 'Embedding-based search with auto-complete',
            personalization: 'User context-aware recommendations',
            performance_optimization: 'Multi-layer caching and optimization'
        },
        endpoints: {
            // Phase 4 Advanced AI
            ml_chat: 'POST /api/ai-advanced/ml-chat',
            recommendations: 'POST /api/ml/recommendations',
            personalized: 'POST /api/ml/personalized',
            
            // Admin Interface
            procedures: 'GET|POST|PUT|DELETE /api/admin/procedures',
            media: 'POST /api/admin/media/upload',
            analytics: 'GET /api/admin/analytics',
            
            // Health & Testing
            health: 'GET /api/ai-advanced/health',
            test: 'GET /api/ai-advanced/test',
            metrics: 'GET /api/ai-advanced/metrics'
        },
        phase4_targets: {
            ml_accuracy: '98%+ procedure recommendation accuracy',
            admin_efficiency: '50% faster content management',
            multimedia_content: '20+ procedures with video tutorials',
            response_time: '<1000ms for advanced features',
            user_satisfaction: '95%+ rating for repair guidance'
        },
        test_examples: {
            ml_enhanced: 'Advanced ML recommendations with user context',
            admin_management: 'Content creation and procedure editing',
            multimedia_integration: 'Video tutorials with step synchronization',
            analytics_dashboard: 'Real-time performance and usage metrics'
        },
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'RevivaTech Phase 4 Advanced Server',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        phase: '4_advanced_server',
        features_status: {
            ml_engine: 'initializing',
            admin_interface: 'developing',
            multimedia_system: 'preparing',
            analytics_dashboard: 'planning'
        },
        timestamp: new Date().toISOString()
    });
});

// Phase 4 basic endpoints (placeholders for development)
app.post('/api/ai-advanced/ml-chat', (req, res) => {
    res.json({
        message: 'Phase 4 ML Chat endpoint - Under Development',
        phase: '4_ml_development',
        status: 'coming_soon',
        features: {
            ml_recommendations: 'Machine learning enhanced suggestions',
            personalization: 'User context-aware responses',
            advanced_analytics: 'Real-time performance tracking'
        }
    });
});

app.get('/api/admin/procedures', (req, res) => {
    res.json({
        message: 'Phase 4 Admin Interface - Under Development',
        phase: '4_admin_development',
        status: 'coming_soon',
        features: {
            content_management: 'Rich text procedure editing',
            media_upload: 'Video and image management',
            analytics_dashboard: 'Usage and performance metrics'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Phase 4 Server error:', err);
    res.status(500).json({
        error: true,
        error_message: 'Internal server error',
        details: err.message,
        phase: '4_server_error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: true,
        error_message: 'Endpoint not found',
        available_endpoints: {
            root: 'GET /',
            health: 'GET /health',
            ml_chat: 'POST /api/ai-advanced/ml-chat',
            admin: 'GET /api/admin/procedures'
        },
        phase: '4_not_found'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 RevivaTech Phase 4 Advanced Server running on port ${PORT}`);
    console.log(`\n🧠 Phase 4 Advanced Features:`);
    console.log(`   🤖 Machine Learning Enhanced Recommendations`);
    console.log(`   👥 Admin Interface for Content Management`);
    console.log(`   🎥 Multimedia Content Integration`);
    console.log(`   📊 Advanced Analytics Dashboard`);
    console.log(`   🔍 Semantic Search with Embeddings`);
    console.log(`   ⚡ Performance Optimization & Caching`);
    console.log(`\n🔗 Phase 4 URLs:`);
    console.log(`   Service Info: http://localhost:${PORT}/`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   ML Chat: http://localhost:${PORT}/api/ai-advanced/ml-chat`);
    console.log(`   Admin Interface: http://localhost:${PORT}/api/admin/procedures`);
    console.log(`\n📱 Test Phase 4 with curl:`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/ai-advanced/ml-chat \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"message": "iPhone 15 Pro screen broken", "user_context": {"skill_level": "expert"}}'`);
    console.log(`\n🎯 Phase 4: Advanced AI Features & Admin Interface - DEVELOPMENT READY\n`);
});

module.exports = app;