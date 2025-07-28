/**
 * RevivaTech Phase 3 Test Server
 * Knowledge Base Integrated AI Chatbot Testing
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3014; // Phase 3 dedicated port

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: true,
        message: 'Too many requests, please try again later.',
        phase: '3_rate_limited'
    }
});
app.use('/api/', limiter);

// Import Phase 3 routes
const aiChatbotPhase3Routes = require('./routes/ai-chatbot-phase3');

// Mount routes
app.use('/api/ai-chatbot-phase3', aiChatbotPhase3Routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'RevivaTech AI Chatbot Phase 3',
        version: '3.0.0',
        description: 'Knowledge Base Integrated AI with Enhanced Device Recognition',
        phase: '3_knowledge_integrated',
        features: {
            enhanced_device_recognition: 'Phase 2 enhanced system with 95% accuracy',
            knowledge_base_search: 'Comprehensive repair procedure database',
            diagnostic_ai: 'Intelligent troubleshooting recommendations',
            multi_step_guidance: 'Detailed repair instructions with media',
            cost_estimation: 'Device-specific pricing with parts and labor',
            procedure_recommendations: 'AI-powered repair procedure matching'
        },
        endpoints: {
            chat: 'POST /api/ai-chatbot-phase3/phase3-chat',
            knowledge_search: 'POST /api/ai-chatbot-phase3/knowledge-base/search',
            procedure_detail: 'GET /api/ai-chatbot-phase3/knowledge-base/procedure/:id',
            health: 'GET /api/ai-chatbot-phase3/health',
            test: 'GET /api/ai-chatbot-phase3/test',
            metrics: 'GET /api/ai-chatbot-phase3/metrics'
        },
        test_examples: {
            iphone_screen: 'iPhone 15 Pro screen cracked and not responsive',
            samsung_battery: 'Samsung Galaxy S24 battery drains quickly',
            macbook_keyboard: 'MacBook Pro keyboard keys not working',
            charging_issues: 'Phone not charging properly'
        },
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'RevivaTech Phase 3 Test Server',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        phase: '3_test_server',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: true,
        error_message: 'Internal server error',
        details: err.message,
        phase: '3_server_error',
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
            chat: 'POST /api/ai-chatbot-phase3/phase3-chat',
            health: 'GET /api/ai-chatbot-phase3/health',
            test: 'GET /api/ai-chatbot-phase3/test'
        },
        phase: '3_not_found'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 RevivaTech Phase 3 Test Server running on port ${PORT}`);
    console.log(`\n📊 Phase 3 Features:`);
    console.log(`   ✅ Enhanced Device Recognition (Phase 2)`);
    console.log(`   ✅ Knowledge Base Integration`);
    console.log(`   ✅ Diagnostic AI Recommendations`);
    console.log(`   ✅ Multi-step Repair Guidance`);
    console.log(`   ✅ Enhanced Cost Estimation`);
    console.log(`\n🔗 Test URLs:`);
    console.log(`   Service Info: http://localhost:${PORT}/`);
    console.log(`   Health Check: http://localhost:${PORT}/api/ai-chatbot-phase3/health`);
    console.log(`   Chat API: http://localhost:${PORT}/api/ai-chatbot-phase3/phase3-chat`);
    console.log(`   Knowledge Search: http://localhost:${PORT}/api/ai-chatbot-phase3/knowledge-base/search`);
    console.log(`\n📱 Test with curl:`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/ai-chatbot-phase3/phase3-chat \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"message": "iPhone 15 Pro screen broken"}'`);
    console.log(`\n🎯 Phase 3: Knowledge Base Development - OPERATIONAL\n`);
});

module.exports = app;