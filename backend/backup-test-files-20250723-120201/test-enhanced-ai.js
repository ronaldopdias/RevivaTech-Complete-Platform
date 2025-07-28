#!/usr/bin/env node
/**
 * Test Script for Enhanced AI Chatbot with NLU Integration
 * Demonstrates the complete AI enhancement implementation
 */

const express = require('express');
const cors = require('cors');
const enhancedAiChatbotRoutes = require('./routes/ai-chatbot-enhanced');

const app = express();
const PORT = 3012; // Use a different port for testing

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add our enhanced AI chatbot routes
app.use('/api/ai-chatbot-enhanced', enhancedAiChatbotRoutes);

// Health check for the test server
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Enhanced AI Chatbot Test Server',
        nluIntegration: 'active',
        port: PORT
    });
});

// Root endpoint with documentation
app.get('/', (req, res) => {
    res.json({
        message: 'RevivaTech Enhanced AI Chatbot Test Server',
        endpoints: {
            health: 'GET /health',
            chatHealth: 'GET /api/ai-chatbot-enhanced/health',
            chat: 'POST /api/ai-chatbot-enhanced/enhanced-chat',
            capabilities: 'GET /api/ai-chatbot-enhanced/capabilities'
        },
        testExamples: {
            'Device Recognition': 'POST /api/ai-chatbot-enhanced/enhanced-chat with message: "My iPhone 14 screen is cracked"',
            'Price Inquiry': 'POST /api/ai-chatbot-enhanced/enhanced-chat with message: "How much to fix MacBook battery?"',
            'Booking Request': 'POST /api/ai-chatbot-enhanced/enhanced-chat with message: "I want to book Samsung Galaxy repair"'
        },
        documentation: 'Use curl or Postman to test the endpoints'
    });
});

// Start the test server
app.listen(PORT, () => {
    console.log(`🚀 Enhanced AI Chatbot Test Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Chat API: http://localhost:${PORT}/api/ai-chatbot-enhanced/enhanced-chat`);
    console.log(`📋 Capabilities: http://localhost:${PORT}/api/ai-chatbot-enhanced/capabilities`);
    console.log('\\n🧪 Test Commands:');
    console.log(`curl -X POST http://localhost:${PORT}/api/ai-chatbot-enhanced/enhanced-chat \\\\`);
    console.log(`  -H "Content-Type: application/json" \\\\`);
    console.log(`  -d '{"message": "My iPhone 14 screen is cracked"}'`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n👋 Shutting down Enhanced AI Chatbot Test Server...');
    process.exit(0);
});

module.exports = app;