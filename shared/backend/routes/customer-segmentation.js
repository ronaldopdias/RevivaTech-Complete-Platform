/**
 * Customer Segmentation API Routes
 * ML-based customer clustering and behavioral segmentation endpoints
 * Part of Phase 8 R1.2 implementation
 */

const express = require('express');
const CustomerSegmentationService = require('../services/CustomerSegmentationService');

const router = express.Router();

// Initialize Customer Segmentation Service
const segmentationService = new CustomerSegmentationService();

// Middleware for JSON parsing
router.use(express.json({ limit: '10mb' }));

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

/**
 * POST /api/customer-segmentation/segment
 * Run customer segmentation for all customers
 */
router.post('/segment', authenticateAdmin, async (req, res) => {
  try {
    console.log('Starting customer segmentation process...');
    
    const result = await segmentationService.segmentAllCustomers();
    
    res.json({
      success: true,
      message: 'Customer segmentation completed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error in customer segmentation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to segment customers',
      message: error.message
    });
  }
});

/**
 * GET /api/customer-segmentation/segments
 * Get all customer segments and their statistics
 */
router.get('/segments', authenticateAdmin, async (req, res) => {
  try {
    // Try to get cached results first
    const cachedResults = await segmentationService.getCachedSegmentationResults();
    
    if (cachedResults) {
      res.json({
        success: true,
        data: cachedResults,
        cached: true
      });
      return;
    }
    
    // If no cached results, return empty state
    res.json({
      success: true,
      data: {
        stats: {},
        timestamp: new Date().toISOString(),
        total_customers: 0
      },
      cached: false,
      message: 'No segmentation data available. Run segmentation first.'
    });
    
  } catch (error) {
    console.error('Error getting customer segments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer segments',
      message: error.message
    });
  }
});

/**
 * GET /api/customer-segmentation/segments/:segment
 * Get details about a specific segment
 */
router.get('/segments/:segment', authenticateAdmin, async (req, res) => {
  try {
    const { segment } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Get customers in this segment
    const result = await segmentationService.db.query(`
      SELECT 
        user_fingerprint,
        user_id,
        customer_segment,
        segmentation_confidence,
        engagement_score,
        lead_score,
        total_booking_value,
        total_bookings,
        total_sessions,
        days_since_last_visit,
        last_seen_at,
        segmentation_updated_at
      FROM user_behavior_profiles
      WHERE customer_segment = $1
      ORDER BY segmentation_confidence DESC, total_booking_value DESC
      LIMIT $2 OFFSET $3
    `, [segment, limit, offset]);
    
    // Get total count
    const countResult = await segmentationService.db.query(
      'SELECT COUNT(*) as total FROM user_behavior_profiles WHERE customer_segment = $1',
      [segment]
    );
    
    const totalCount = parseInt(countResult.rows[0].total);
    
    // Get segment definition
    const segmentDefinition = segmentationService.segmentDefinitions[segment] || {};
    
    res.json({
      success: true,
      data: {
        segment,
        definition: segmentDefinition,
        customers: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting segment details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get segment details',
      message: error.message
    });
  }
});

/**
 * GET /api/customer-segmentation/customer/:fingerprint
 * Get segmentation details for a specific customer
 */
router.get('/customer/:fingerprint', authenticateAdmin, async (req, res) => {
  try {
    const { fingerprint } = req.params;
    
    // Get customer profile
    const profileResult = await segmentationService.db.query(`
      SELECT 
        user_fingerprint,
        user_id,
        customer_segment,
        segmentation_confidence,
        segmentation_algorithm,
        segmentation_updated_at,
        engagement_score,
        lead_score,
        churn_risk_score,
        total_booking_value,
        total_bookings,
        total_sessions,
        days_since_last_visit,
        last_seen_at,
        first_seen_at
      FROM user_behavior_profiles
      WHERE user_fingerprint = $1
    `, [fingerprint]);
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Get segment recommendations
    const recommendations = await segmentationService.getSegmentRecommendations(fingerprint);
    
    // Get recent behavioral data
    const behaviorResult = await segmentationService.db.query(`
      SELECT 
        event_type,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM analytics_events
      WHERE user_fingerprint = $1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `, [fingerprint]);
    
    res.json({
      success: true,
      data: {
        profile,
        recommendations,
        recent_behavior: behaviorResult.rows,
        last_updated: profile.segmentation_updated_at
      }
    });
    
  } catch (error) {
    console.error('Error getting customer segmentation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer segmentation',
      message: error.message
    });
  }
});

/**
 * POST /api/customer-segmentation/customer/:fingerprint/segment
 * Manually update a customer's segment
 */
router.post('/customer/:fingerprint/segment', authenticateAdmin, async (req, res) => {
  try {
    const { fingerprint } = req.params;
    const { segment, reason } = req.body;
    
    if (!segment) {
      return res.status(400).json({
        success: false,
        error: 'Segment is required'
      });
    }
    
    // Validate segment
    if (!segmentationService.segmentDefinitions[segment]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid segment'
      });
    }
    
    // Update customer segment
    const result = await segmentationService.db.query(`
      UPDATE user_behavior_profiles
      SET 
        customer_segment = $1,
        segmentation_confidence = 1.0,
        segmentation_algorithm = 'manual',
        segmentation_updated_at = NOW(),
        last_updated_at = NOW()
      WHERE user_fingerprint = $2
      RETURNING *
    `, [segment, fingerprint]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    // Log the manual update
    await segmentationService.db.query(`
      INSERT INTO analytics_events (
        user_fingerprint,
        session_id,
        event_type,
        event_name,
        event_data
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      fingerprint,
      'manual_update',
      'segment_manual_update',
      'Manual Segment Update',
      JSON.stringify({
        new_segment: segment,
        reason: reason || 'Manual update by admin',
        updated_by: 'admin', // TODO: Get actual user ID
        updated_at: new Date().toISOString()
      })
    ]);
    
    res.json({
      success: true,
      message: 'Customer segment updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating customer segment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer segment',
      message: error.message
    });
  }
});

/**
 * GET /api/customer-segmentation/analytics
 * Get segmentation analytics and insights
 */
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30 days' } = req.query;
    
    // Get segment distribution
    const segmentDistribution = await segmentationService.db.query(`
      SELECT 
        customer_segment,
        COUNT(*) as count,
        AVG(segmentation_confidence) as avg_confidence,
        AVG(engagement_score) as avg_engagement,
        AVG(lead_score) as avg_lead_score,
        AVG(total_booking_value) as avg_booking_value,
        AVG(total_bookings) as avg_bookings
      FROM user_behavior_profiles
      WHERE last_seen_at >= NOW() - INTERVAL $1
      GROUP BY customer_segment
      ORDER BY count DESC
    `, [timeframe]);
    
    // Get segmentation trends
    const trends = await segmentationService.db.query(`
      SELECT 
        DATE_TRUNC('day', segmentation_updated_at) as date,
        customer_segment,
        COUNT(*) as count
      FROM user_behavior_profiles
      WHERE segmentation_updated_at >= NOW() - INTERVAL $1
      GROUP BY DATE_TRUNC('day', segmentation_updated_at), customer_segment
      ORDER BY date DESC, count DESC
    `, [timeframe]);
    
    // Get conversion rates by segment
    const conversionRates = await segmentationService.db.query(`
      SELECT 
        customer_segment,
        COUNT(*) as total_customers,
        SUM(CASE WHEN total_bookings > 0 THEN 1 ELSE 0 END) as converted_customers,
        ROUND(
          (SUM(CASE WHEN total_bookings > 0 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2
        ) as conversion_rate
      FROM user_behavior_profiles
      WHERE last_seen_at >= NOW() - INTERVAL $1
      GROUP BY customer_segment
      ORDER BY conversion_rate DESC
    `, [timeframe]);
    
    // Get segment value analysis
    const valueAnalysis = await segmentationService.db.query(`
      SELECT 
        customer_segment,
        COUNT(*) as customer_count,
        SUM(total_booking_value) as total_value,
        AVG(total_booking_value) as avg_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_booking_value) as median_value,
        MAX(total_booking_value) as max_value
      FROM user_behavior_profiles
      WHERE last_seen_at >= NOW() - INTERVAL $1
      GROUP BY customer_segment
      ORDER BY total_value DESC
    `, [timeframe]);
    
    res.json({
      success: true,
      data: {
        timeframe,
        segment_distribution: segmentDistribution.rows,
        trends: trends.rows,
        conversion_rates: conversionRates.rows,
        value_analysis: valueAnalysis.rows,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error getting segmentation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get segmentation analytics',
      message: error.message
    });
  }
});

/**
 * POST /api/customer-segmentation/schedule
 * Schedule automatic segmentation
 */
router.post('/schedule', authenticateAdmin, async (req, res) => {
  try {
    const { enabled = true, frequency = 'daily', time = '02:00' } = req.body;
    
    // TODO: Implement actual scheduling with cron jobs
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Segmentation schedule updated',
      data: {
        enabled,
        frequency,
        time,
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      }
    });
    
  } catch (error) {
    console.error('Error scheduling segmentation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule segmentation',
      message: error.message
    });
  }
});

/**
 * GET /api/customer-segmentation/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await segmentationService.db.query('SELECT 1');
    
    // Test Redis connection
    await segmentationService.redis.ping();
    
    // Check if we have recent segmentation data
    const cachedResults = await segmentationService.getCachedSegmentationResults();
    const hasRecentData = cachedResults && cachedResults.timestamp;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        segmentation: 'operational'
      },
      data: {
        has_recent_segmentation: !!hasRecentData,
        last_segmentation: hasRecentData ? cachedResults.timestamp : null
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

module.exports = router;