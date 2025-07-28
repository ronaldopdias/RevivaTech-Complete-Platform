/**
 * RevivaTech Enhanced AI Test Server - Phase 2
 * Standalone server for testing 98%+ device recognition accuracy
 */

const express = require('express');
const cors = require('cors');
const enhancedAiRoutes = require('./routes/ai-chatbot-enhanced-phase2');

const app = express();
const PORT = 3013; // New port for Phase 2 testing

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Mount enhanced AI routes
app.use('/api/ai-chatbot-enhanced-phase2', enhancedAiRoutes);

// Root endpoint with Phase 2 information
app.get('/', (req, res) => {
    res.json({
        service: 'RevivaTech Enhanced AI Test Server',
        phase: '2_enhanced',
        version: '2.0.0',
        capabilities: {
            device_recognition: '98%+ accuracy',
            user_agent_parsing: 'Matomo Device Detector',
            problem_identification: '90%+ accuracy',
            repair_insights: 'Device-specific cost estimation',
            response_time: '<1 second'
        },
        endpoints: {
            chat: '/api/ai-chatbot-enhanced-phase2/enhanced-chat',
            health: '/api/ai-chatbot-enhanced-phase2/health',
            performance: '/api/ai-chatbot-enhanced-phase2/performance',
            test: '/api/ai-chatbot-enhanced-phase2/test'
        },
        test_examples: [
            {
                endpoint: '/api/ai-chatbot-enhanced-phase2/enhanced-chat',
                method: 'POST',
                body: {
                    message: 'iPhone 14 Pro cracked screen'
                }
            },
            {
                endpoint: '/api/ai-chatbot-enhanced-phase2/enhanced-chat',
                method: 'POST',
                body: {
                    message: 'Samsung Galaxy battery issues'
                }
            }
        ],
        timestamp: new Date().toISOString()
    });
});

// Health check for the test server itself
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Enhanced AI Test Server',
        phase: '2_enhanced',
        port: PORT,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Test server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        phase: '2_enhanced'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: [
            '/',
            '/health',
            '/api/ai-chatbot-enhanced-phase2/enhanced-chat',
            '/api/ai-chatbot-enhanced-phase2/health',
            '/api/ai-chatbot-enhanced-phase2/performance',
            '/api/ai-chatbot-enhanced-phase2/test'
        ],
        phase: '2_enhanced'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 RevivaTech Enhanced AI Test Server - Phase 2');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log('🎯 Enhanced Features:');
    console.log('   • 98%+ device recognition accuracy');
    console.log('   • Matomo Device Detector integration');
    console.log('   • User agent parsing');
    console.log('   • Device-specific repair insights');
    console.log('   • Sub-second response times');
    console.log('');
    console.log('🧪 Test endpoints:');
    console.log(`   • Chat: POST http://localhost:${PORT}/api/ai-chatbot-enhanced-phase2/enhanced-chat`);
    console.log(`   • Health: GET http://localhost:${PORT}/api/ai-chatbot-enhanced-phase2/health`);
    console.log(`   • Performance: GET http://localhost:${PORT}/api/ai-chatbot-enhanced-phase2/performance`);
    console.log(`   • Test Suite: POST http://localhost:${PORT}/api/ai-chatbot-enhanced-phase2/test`);
    console.log('');
    console.log('📊 Phase 2 Success Metrics:');
    console.log('   • Device Recognition: Target 98%+');
    console.log('   • Problem Identification: Target 90%+');
    console.log('   • Response Time: Target <1 second');
    console.log('   • Overall Confidence: Target 85%+');
    console.log('');
    console.log('🔗 Quick test: curl -X POST http://localhost:' + PORT + '/api/ai-chatbot-enhanced-phase2/enhanced-chat -H "Content-Type: application/json" -d \'{"message": "iPhone 15 screen broken"}\'');
});

module.exports = app;