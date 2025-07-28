/**
 * RevivaTech AI Chatbot Routes - Phase 3 with Knowledge Base Integration
 * Comprehensive repair guidance with device recognition and knowledge base
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// Configuration
const PYTHON_PATH = '/app/venv/bin/python3';
const NLU_SCRIPT_PATH = '/app/nlu/services/nlu_api_phase3.py';

/**
 * Enhanced chat endpoint with Phase 3 knowledge base integration
 * Provides comprehensive repair guidance and procedure recommendations
 */
router.post('/phase3-chat', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, user_agent, context, session_id } = req.body;
        
        // Validation
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                error: true,
                error_message: 'Message is required and must be a non-empty string',
                phase: '3_validation_error'
            });
        }
        
        if (message.length > 1000) {
            return res.status(400).json({
                error: true,
                error_message: 'Message too long (max 1000 characters)',
                phase: '3_validation_error'
            });
        }
        
        // Prepare Python process arguments
        const args = [NLU_SCRIPT_PATH, message];
        if (user_agent) {
            args.push(user_agent);
        }
        
        // Execute Phase 3 NLU processing
        const pythonProcess = spawn(PYTHON_PATH, args, {
            cwd: '/app',
            env: { ...process.env, PYTHONPATH: '/app' }
        });
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            const processingTime = Date.now() - startTime;
            
            try {
                if (code !== 0) {
                    console.error('Python process error:', stderr);
                    return res.status(500).json({
                        error: true,
                        error_message: 'AI processing failed',
                        details: stderr.substring(0, 200),
                        phase: '3_processing_error',
                        processing_time: processingTime
                    });
                }
                
                // Parse Python output (JSON)
                const cleanOutput = stdout.replace(/ERROR:.*$/gm, '').trim();
                const lines = cleanOutput.split('\n');
                const jsonLine = lines.find(line => line.startsWith('{'));
                
                if (!jsonLine) {
                    throw new Error('No valid JSON output from Python process');
                }
                
                const result = JSON.parse(jsonLine);
                
                // Enhance result with Node.js metadata
                const enhancedResult = {
                    ...result,
                    api_metadata: {
                        request_id: session_id || `req_${Date.now()}`,
                        processing_time_ms: processingTime,
                        api_version: '3.0_knowledge_integrated',
                        timestamp: new Date().toISOString(),
                        user_agent_provided: !!user_agent,
                        context_provided: !!context
                    },
                    enhanced_features: {
                        knowledge_base_enabled: true,
                        diagnostic_ai_enabled: true,
                        procedure_recommendations: true,
                        cost_estimation_enhanced: true,
                        multi_step_guidance: true
                    }
                };
                
                // Add request context if provided
                if (context) {
                    enhancedResult.request_context = context;
                }
                
                res.json(enhancedResult);
                
            } catch (parseError) {
                console.error('JSON parsing error:', parseError.message);
                console.error('Raw output:', stdout);
                
                res.status(500).json({
                    error: true,
                    error_message: 'Failed to parse AI response',
                    details: parseError.message,
                    phase: '3_parsing_error',
                    processing_time: processingTime
                });
            }
        });
        
        // Handle process timeout (30 seconds)
        setTimeout(() => {
            pythonProcess.kill('SIGTERM');
            res.status(408).json({
                error: true,
                error_message: 'AI processing timeout',
                phase: '3_timeout_error',
                processing_time: Date.now() - startTime
            });
        }, 30000);
        
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            error: true,
            error_message: 'Internal server error',
            details: error.message,
            phase: '3_route_error',
            processing_time: Date.now() - startTime
        });
    }
});

/**
 * Search knowledge base for repair procedures
 */
router.post('/knowledge-base/search', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { query, device_brand, device_model, problem_category } = req.body;
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: true,
                error_message: 'Search query is required'
            });
        }
        
        // Use knowledge base service directly
        const args = [
            '/app/nlu/services/knowledge_base_service.py',
            query,
            device_brand || 'Unknown',
            device_model || 'Unknown',
            problem_category || 'general'
        ];
        
        const pythonProcess = spawn(PYTHON_PATH, args, {
            cwd: '/app',
            env: { ...process.env, PYTHONPATH: '/app' }
        });
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            const processingTime = Date.now() - startTime;
            
            try {
                if (code !== 0) {
                    return res.status(500).json({
                        error: true,
                        error_message: 'Knowledge base search failed',
                        processing_time: processingTime
                    });
                }
                
                const cleanOutput = stdout.replace(/ERROR:.*$/gm, '').trim();
                const result = JSON.parse(cleanOutput);
                
                res.json({
                    ...result,
                    api_metadata: {
                        processing_time_ms: processingTime,
                        search_type: 'knowledge_base_direct',
                        timestamp: new Date().toISOString()
                    }
                });
                
            } catch (parseError) {
                res.status(500).json({
                    error: true,
                    error_message: 'Failed to parse knowledge base response',
                    processing_time: processingTime
                });
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: true,
            error_message: 'Knowledge base search error',
            details: error.message,
            processing_time: Date.now() - startTime
        });
    }
});

/**
 * Get specific repair procedure by ID
 */
router.get('/knowledge-base/procedure/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                error: true,
                error_message: 'Valid procedure ID is required'
            });
        }
        
        // For now, return a placeholder - this would query the database directly
        res.json({
            message: 'Procedure retrieval endpoint - to be implemented',
            procedure_id: id,
            phase: '3_procedure_endpoint'
        });
        
    } catch (error) {
        res.status(500).json({
            error: true,
            error_message: 'Procedure retrieval error',
            details: error.message
        });
    }
});

/**
 * Health check endpoint for Phase 3 system
 */
router.get('/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Test Python environment
        const pythonProcess = spawn(PYTHON_PATH, ['-c', 'import sys; print("Python OK")'], {
            cwd: '/app'
        });
        
        let stdout = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            const responseTime = Date.now() - startTime;
            
            res.json({
                status: code === 0 ? 'healthy' : 'unhealthy',
                phase: '3_knowledge_integrated',
                python_environment: code === 0 ? 'OK' : 'FAILED',
                features: {
                    phase2_enhanced_nlu: 'enabled',
                    knowledge_base: 'enabled',
                    diagnostic_ai: 'enabled',
                    procedure_search: 'enabled',
                    cost_estimation: 'enhanced'
                },
                performance: {
                    health_check_time_ms: responseTime
                },
                version: '3.0.0',
                timestamp: new Date().toISOString()
            });
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
            pythonProcess.kill('SIGTERM');
            res.status(503).json({
                status: 'timeout',
                phase: '3_health_timeout'
            });
        }, 5000);
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error_message: error.message,
            phase: '3_health_error'
        });
    }
});

/**
 * Test endpoint with sample data
 */
router.get('/test', async (req, res) => {
    try {
        const testMessage = 'iPhone 15 Pro screen cracked';
        
        // Redirect to main chat endpoint
        req.body = { message: testMessage };
        return router.handle(req, res);
        
    } catch (error) {
        res.status(500).json({
            error: true,
            error_message: 'Test endpoint error',
            details: error.message
        });
    }
});

/**
 * Performance metrics endpoint
 */
router.get('/metrics', (req, res) => {
    res.json({
        service: 'AI Chatbot Phase 3',
        version: '3.0.0_knowledge_integrated',
        features: {
            enhanced_device_recognition: 'operational',
            knowledge_base_integration: 'operational',
            diagnostic_recommendations: 'operational',
            multi_step_guidance: 'operational',
            cost_estimation: 'enhanced'
        },
        performance_targets: {
            response_time_target: '<2000ms',
            device_recognition_accuracy: '>95%',
            knowledge_base_coverage: '500+ procedures',
            success_rate_target: '>90%'
        },
        phase: '3_knowledge_integrated',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;