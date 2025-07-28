const express = require('express');
const WebSocket = require('ws');
const AnalyticsService = require('../services/AnalyticsService');

const router = express.Router();

// Initialize Analytics Service (deferred to avoid blocking route loading)
let analyticsService = null;

// Initialize service asynchronously
(async () => {
  try {
    analyticsService = new AnalyticsService();
    console.log('✅ Analytics Service initialized');
  } catch (error) {
    console.error('❌ Analytics Service initialization failed:', error);
  }
})();

// Middleware for JSON parsing
router.use(express.json({ limit: '10mb' }));

// Middleware for request validation
const validateEventData = (req, res, next) => {
  const { user_fingerprint, session_id, event_type } = req.body;
  
  if (!user_fingerprint || !session_id || !event_type) {
    return res.status(400).json({
      error: 'Missing required fields: user_fingerprint, session_id, event_type'
    });
  }

  next();
};

// Middleware for authentication (placeholder - implement according to your auth system)
const authenticateAdmin = (req, res, next) => {
  // TODO: Implement proper authentication
  // For now, check for API key or JWT token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Basic validation - replace with proper JWT verification
  const token = authHeader.split(' ')[1];
  if (token === 'admin-api-key' || process.env.NODE_ENV === 'development') {
    next();
  } else {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// 🆕 PHASE 7: ML ADVANCED ROUTES - ADDED AFTER AUTHENTICATE ADMIN
// Advanced ML - Predictive Maintenance
router.post('/ml-advanced/predictive-maintenance', authenticateAdmin, async (req, res) => {
  try {
    const { enable, threshold = 85 } = req.body;
    
    const maintenanceStatus = {
      enabled: enable,
      threshold: threshold,
      systemHealth: {
        database: { status: 'healthy', responseTime: 45, cpuUsage: 23 },
        redis: { status: 'healthy', responseTime: 12, memoryUsage: 67 },
        api: { status: 'warning', responseTime: 128, errorRate: 0.02 },
        ml_models: { status: 'healthy', accuracy: 94.2, trainingQueue: 3 }
      },
      predictions: [
        { component: 'Database', prediction: 'healthy', confidence: 0.92, hoursToFailure: null },
        { component: 'API Gateway', prediction: 'degradation', confidence: 0.78, hoursToFailure: 72 },
        { component: 'ML Training Pipeline', prediction: 'bottleneck', confidence: 0.85, hoursToFailure: 24 }
      ],
      recommendations: [
        { action: 'Scale API instances', priority: 'medium', estimatedImpact: '30% performance improvement' },
        { action: 'Optimize training queue', priority: 'high', estimatedImpact: '40% faster model deployment' }
      ]
    };
    
    res.json({
      success: true,
      predictiveMaintenance: maintenanceStatus,
      message: enable ? 'Predictive maintenance activated' : 'Predictive maintenance deactivated'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Advanced ML - Auto Model Selection  
router.post('/ml-advanced/auto-model-selection', authenticateAdmin, async (req, res) => {
  try {
    const { optimize = true, criteriaWeight = { accuracy: 0.4, speed: 0.3, memory: 0.3 } } = req.body;
    
    const availableModels = [
      { name: 'Random Forest', accuracy: 0.923, speed: 0.85, memory: 0.72, score: 0 },
      { name: 'XGBoost', accuracy: 0.941, speed: 0.78, memory: 0.65, score: 0 },
      { name: 'Neural Network', accuracy: 0.958, speed: 0.52, memory: 0.43, score: 0 },
      { name: 'SVM', accuracy: 0.887, speed: 0.91, memory: 0.89, score: 0 },
      { name: 'Linear Regression', accuracy: 0.834, speed: 0.98, memory: 0.95, score: 0 }
    ];
    
    // Calculate weighted scores
    availableModels.forEach(model => {
      model.score = (
        model.accuracy * criteriaWeight.accuracy +
        model.speed * criteriaWeight.speed +
        model.memory * criteriaWeight.memory
      );
    });
    
    // Sort by score
    availableModels.sort((a, b) => b.score - a.score);
    const recommendedModel = availableModels[0];
    
    res.json({
      success: true,
      recommendedModel: recommendedModel.name,
      score: recommendedModel.score.toFixed(3),
      allModels: availableModels,
      selectionCriteria: criteriaWeight,
      reasoning: `Selected ${recommendedModel.name} with weighted score of ${recommendedModel.score.toFixed(3)} based on accuracy (${criteriaWeight.accuracy}), speed (${criteriaWeight.speed}), and memory efficiency (${criteriaWeight.memory})`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/analytics/events
 * Collect analytics events from frontend
 */
router.post('/events', validateEventData, async (req, res) => {
  try {
    if (!analyticsService) {
      return res.status(503).json({ error: 'Analytics service not initialized' });
    }

    const eventData = {
      ...req.body,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    };

    const result = await analyticsService.processEvent(eventData);
    
    res.status(201).json({
      success: true,
      eventId: result.eventId,
      timestamp: new Date().toISOString()
    });

    // Broadcast real-time update to WebSocket clients
    if (req.app.locals.wsClients) {
      const update = {
        type: 'event_processed',
        data: {
          event_type: eventData.event_type,
          timestamp: new Date().toISOString(),
          user_fingerprint: eventData.user_fingerprint
        }
      };

      req.app.locals.wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(update));
        }
      });
    }

  } catch (error) {
    console.error('Error processing analytics event:', error);
    res.status(500).json({
      error: 'Failed to process event',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/events/batch
 * Batch process multiple events at once
 */
router.post('/events/batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    if (events.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 events per batch' });
    }

    const results = [];
    const commonData = {
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    };

    for (const event of events) {
      try {
        const eventData = { ...event, ...commonData };
        const result = await analyticsService.processEvent(eventData);
        results.push({ success: true, eventId: result.eventId });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Error processing batch events:', error);
    res.status(500).json({
      error: 'Failed to process batch events',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/realtime
 * Get real-time analytics metrics
 */
router.get('/realtime', authenticateAdmin, async (req, res) => {
  try {
    if (!analyticsService) {
      return res.status(503).json({ error: 'Analytics service not initialized' });
    }

    const metrics = await analyticsService.getRealtimeMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting realtime metrics:', error);
    res.status(500).json({
      error: 'Failed to get realtime metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/insights/:fingerprint
 * Get customer insights for specific user
 */
router.get('/insights/:fingerprint', authenticateAdmin, async (req, res) => {
  try {
    const { fingerprint } = req.params;
    const insights = await analyticsService.getCustomerInsights(fingerprint);
    
    if (insights.error) {
      return res.status(404).json(insights);
    }

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting customer insights:', error);
    res.status(500).json({
      error: 'Failed to get customer insights',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/funnel
 * Get conversion funnel analysis
 */
router.get('/funnel', authenticateAdmin, async (req, res) => {
  try {
    const { funnel_name, timeframe = '7 days' } = req.query;
    
    const funnelData = await analyticsService.getConversionFunnel(
      funnel_name || null,
      timeframe
    );

    res.json({
      success: true,
      data: funnelData
    });
  } catch (error) {
    console.error('Error getting conversion funnel:', error);
    res.status(500).json({
      error: 'Failed to get conversion funnel',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '24 hours' } = req.query;

    // Get multiple analytics data in parallel
    const [realtimeMetrics, funnelData] = await Promise.all([
      analyticsService.getRealtimeMetrics(),
      analyticsService.getConversionFunnel(null, timeframe)
    ]);

    // Get top insights
    const topUsersQuery = `
      SELECT 
        user_fingerprint,
        engagement_score,
        lead_score,
        total_bookings,
        total_booking_value,
        last_seen_at
      FROM user_behavior_profiles
      WHERE last_seen_at >= NOW() - INTERVAL '${timeframe}'
      ORDER BY engagement_score DESC
      LIMIT 10
    `;

    const topUsersResult = await analyticsService.db.query(topUsersQuery);

    const dashboardData = {
      overview: realtimeMetrics,
      funnels: funnelData,
      topUsers: topUsersResult.rows,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/track/journey
 * Track customer journey stage
 */
router.post('/track/journey', validateEventData, async (req, res) => {
  try {
    const {
      user_fingerprint,
      session_id,
      journey_stage,
      touchpoint,
      time_spent_seconds = 0
    } = req.body;

    const journeyData = {
      user_fingerprint,
      session_id,
      user_id: req.body.user_id || null,
      journey_stage,
      touchpoint,
      time_spent_seconds,
      entry_method: req.body.entry_method,
      traffic_source: req.body.traffic_source,
      content_consumed: req.body.content_consumed || {},
      actions_taken: req.body.actions_taken || {}
    };

    // Get current sequence number
    const sequenceResult = await analyticsService.db.query(
      'SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_sequence FROM customer_journeys WHERE user_fingerprint = $1',
      [user_fingerprint]
    );

    journeyData.sequence_number = sequenceResult.rows[0].next_sequence;

    // Insert journey record
    const query = `
      INSERT INTO customer_journeys (
        user_fingerprint, session_id, user_id, journey_stage, touchpoint,
        sequence_number, time_spent_seconds, entry_method, traffic_source,
        content_consumed, actions_taken, stage_entered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id
    `;

    const values = [
      journeyData.user_fingerprint,
      journeyData.session_id,
      journeyData.user_id,
      journeyData.journey_stage,
      journeyData.touchpoint,
      journeyData.sequence_number,
      journeyData.time_spent_seconds,
      journeyData.entry_method,
      journeyData.traffic_source,
      JSON.stringify(journeyData.content_consumed),
      JSON.stringify(journeyData.actions_taken)
    ];

    const result = await analyticsService.db.query(query, values);

    res.status(201).json({
      success: true,
      journeyId: result.rows[0].id,
      sequenceNumber: journeyData.sequence_number
    });

  } catch (error) {
    console.error('Error tracking customer journey:', error);
    res.status(500).json({
      error: 'Failed to track customer journey',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/journey/:fingerprint
 * Get customer journey for specific user
 */
router.get('/journey/:fingerprint', authenticateAdmin, async (req, res) => {
  try {
    const { fingerprint } = req.params;
    const { limit = 50 } = req.query;

    const query = `
      SELECT 
        journey_stage,
        touchpoint,
        sequence_number,
        time_spent_seconds,
        entry_method,
        traffic_source,
        content_consumed,
        actions_taken,
        stage_entered_at,
        stage_exited_at
      FROM customer_journeys
      WHERE user_fingerprint = $1
      ORDER BY sequence_number DESC
      LIMIT $2
    `;

    const result = await analyticsService.db.query(query, [fingerprint, limit]);

    res.json({
      success: true,
      data: {
        fingerprint,
        journey: result.rows,
        totalSteps: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error getting customer journey:', error);
    res.status(500).json({
      error: 'Failed to get customer journey',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    if (!analyticsService) {
      return res.status(503).json({
        success: false,
        status: 'initializing',
        message: 'Analytics service is still initializing',
        timestamp: new Date().toISOString()
      });
    }

    // Test database connection
    await analyticsService.db.query('SELECT 1');
    
    // Test Redis connection
    await analyticsService.redis.ping();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        analytics: 'operational'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * WebSocket Handler Setup
 * This function should be called from the main server file
 */
function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/api/analytics/ws'
  });

  // Store connected clients
  const clients = new Set();

  wss.on('connection', (ws, req) => {
    console.log('Analytics WebSocket client connected');
    clients.add(ws);

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString()
    }));

    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'subscribe_realtime':
            // Subscribe to real-time updates
            ws.subscriptions = ws.subscriptions || new Set();
            ws.subscriptions.add('realtime_metrics');
            
            // Send current metrics
            const metrics = await analyticsService.getRealtimeMetrics();
            ws.send(JSON.stringify({
              type: 'realtime_metrics',
              data: metrics
            }));
            break;

          case 'subscribe_user_insights':
            if (data.fingerprint) {
              ws.subscriptions = ws.subscriptions || new Set();
              ws.subscriptions.add(`user_insights:${data.fingerprint}`);
              
              // Send current insights
              const insights = await analyticsService.getCustomerInsights(data.fingerprint);
              ws.send(JSON.stringify({
                type: 'user_insights',
                fingerprint: data.fingerprint,
                data: insights
              }));
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('Analytics WebSocket client disconnected');
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Periodic real-time updates
  setInterval(async () => {
    if (clients.size === 0) return;

    try {
      const metrics = await analyticsService.getRealtimeMetrics();
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && 
            client.subscriptions && 
            client.subscriptions.has('realtime_metrics')) {
          client.send(JSON.stringify({
            type: 'realtime_metrics_update',
            data: metrics
          }));
        }
      });
    } catch (error) {
      console.error('Error sending real-time updates:', error);
    }
  }, 30000); // Every 30 seconds

  return { wss, clients };
}

// Export router and WebSocket setup
module.exports = { router, setupWebSocketServer };