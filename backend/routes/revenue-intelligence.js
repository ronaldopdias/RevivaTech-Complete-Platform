/**
 * Revenue Intelligence API Routes
 * Financial analytics and revenue forecasting endpoints
 * Part of Phase 8 R2.2 implementation
 */

const express = require('express');
const RevenueIntelligenceService = require('../services/RevenueIntelligenceService');

const router = express.Router();

// Initialize Revenue Intelligence Service
const revenueService = new RevenueIntelligenceService();

// Middleware for JSON parsing
router.use(express.json({ limit: '10mb' }));

// Middleware for authentication
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'admin-api-key' || process.env.NODE_ENV === 'development') {
    next();
  } else {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

/**
 * GET /api/revenue-intelligence/analytics
 * Get comprehensive revenue analytics
 */
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await revenueService.getRevenueAnalytics(timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/overview
 * Get revenue overview metrics
 */
router.get('/overview', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const overview = await revenueService.getRevenueOverview(interval);
    
    res.json({
      success: true,
      data: overview,
      timeframe
    });
    
  } catch (error) {
    console.error('Error getting revenue overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue overview',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/trends
 * Get revenue trends over time
 */
router.get('/trends', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const trends = await revenueService.getRevenueTrends(interval);
    
    res.json({
      success: true,
      data: trends,
      timeframe
    });
    
  } catch (error) {
    console.error('Error getting revenue trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue trends',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/breakdown
 * Get revenue breakdown by dimensions
 */
router.get('/breakdown', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const breakdown = await revenueService.getRevenueBreakdown(interval);
    
    res.json({
      success: true,
      data: breakdown,
      timeframe
    });
    
  } catch (error) {
    console.error('Error getting revenue breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue breakdown',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/forecasting
 * Get revenue forecasting data
 */
router.get('/forecasting', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const forecasting = await revenueService.getRevenueForecasting(interval);
    
    res.json({
      success: true,
      data: forecasting,
      timeframe
    });
    
  } catch (error) {
    console.error('Error getting revenue forecasting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue forecasting',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/profitability
 * Get profitability analysis
 */
router.get('/profitability', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const profitability = await revenueService.getProfitabilityAnalysis(interval);
    
    res.json({
      success: true,
      data: profitability,
      timeframe
    });
    
  } catch (error) {
    console.error('Error getting profitability analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profitability analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/cohort-analysis
 * Get cohort analysis data
 */
router.get('/cohort-analysis', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '90d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const cohortAnalysis = await revenueService.getCohortAnalysis(interval);
    
    res.json({
      success: true,
      data: cohortAnalysis,
      timeframe
    });
    
  } catch (error) {
    console.error('Error getting cohort analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cohort analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/kpis
 * Get key financial KPIs
 */
router.get('/kpis', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const [overview, profitability] = await Promise.all([
      revenueService.getRevenueOverview(interval),
      revenueService.getProfitabilityAnalysis(interval)
    ]);
    
    const kpis = {
      monthly_recurring_revenue: {
        name: 'Monthly Recurring Revenue',
        value: overview.total_revenue.current,
        change: overview.total_revenue.change,
        unit: '£',
        target: 10000,
        status: overview.total_revenue.current >= 10000 ? 'good' : 'warning'
      },
      average_order_value: {
        name: 'Average Order Value',
        value: overview.avg_order_value.current,
        change: overview.avg_order_value.change,
        unit: '£',
        target: 200,
        status: overview.avg_order_value.current >= 200 ? 'good' : 'warning'
      },
      customer_acquisition_cost: {
        name: 'Customer Acquisition Cost',
        value: profitability.cac_analysis.reduce((sum, item) => sum + item.estimated_cac, 0) / profitability.cac_analysis.length,
        change: 0, // TODO: Calculate change
        unit: '£',
        target: 50,
        status: 'good'
      },
      customer_lifetime_value: {
        name: 'Customer Lifetime Value',
        value: profitability.clv_analysis.avg_clv,
        change: 0, // TODO: Calculate change
        unit: '£',
        target: 500,
        status: profitability.clv_analysis.avg_clv >= 500 ? 'good' : 'warning'
      },
      gross_margin: {
        name: 'Gross Margin',
        value: profitability.overall_metrics.overall_profit_margin,
        change: 0, // TODO: Calculate change
        unit: '%',
        target: 60,
        status: profitability.overall_metrics.overall_profit_margin >= 60 ? 'good' : 'warning'
      },
      revenue_growth_rate: {
        name: 'Revenue Growth Rate',
        value: overview.total_revenue.change,
        change: 0, // This is the actual change
        unit: '%',
        target: 20,
        status: overview.total_revenue.change >= 20 ? 'good' : overview.total_revenue.change >= 10 ? 'warning' : 'danger'
      }
    };
    
    res.json({
      success: true,
      data: kpis,
      timeframe,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting financial KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get financial KPIs',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/insights
 * Get automated revenue insights
 */
router.get('/insights', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    const [analytics, trends] = await Promise.all([
      revenueService.getRevenueAnalytics(timeframe),
      revenueService.getRevenueTrends(interval)
    ]);
    
    const insights = [];
    
    // Revenue growth insights
    if (analytics.overview.total_revenue.change > 25) {
      insights.push({
        type: 'positive',
        category: 'revenue',
        title: 'Strong Revenue Growth',
        description: `Revenue increased by ${analytics.overview.total_revenue.change.toFixed(1)}% compared to previous period`,
        impact: 'high',
        recommendation: 'Scale successful strategies and invest in growth opportunities'
      });
    } else if (analytics.overview.total_revenue.change < -10) {
      insights.push({
        type: 'warning',
        category: 'revenue',
        title: 'Revenue Decline',
        description: `Revenue decreased by ${Math.abs(analytics.overview.total_revenue.change).toFixed(1)}% compared to previous period`,
        impact: 'high',
        recommendation: 'Investigate causes and implement recovery strategies'
      });
    }
    
    // AOV insights
    if (analytics.overview.avg_order_value.change > 15) {
      insights.push({
        type: 'positive',
        category: 'pricing',
        title: 'Increasing Average Order Value',
        description: `Average order value increased by ${analytics.overview.avg_order_value.change.toFixed(1)}%`,
        impact: 'medium',
        recommendation: 'Continue upselling and cross-selling strategies'
      });
    }
    
    // Service profitability insights
    if (analytics.profitability.service_profitability.length > 0) {
      const mostProfitable = analytics.profitability.service_profitability[0];
      if (mostProfitable.profit_margin > 70) {
        insights.push({
          type: 'positive',
          category: 'profitability',
          title: 'High-Margin Service Identified',
          description: `${mostProfitable.service_type} has ${mostProfitable.profit_margin.toFixed(1)}% profit margin`,
          impact: 'medium',
          recommendation: 'Focus marketing efforts on high-margin services'
        });
      }
    }
    
    // Forecasting insights
    if (analytics.forecasting.forecast_summary.growth_rate > 10) {
      insights.push({
        type: 'positive',
        category: 'forecasting',
        title: 'Positive Revenue Forecast',
        description: `Projected revenue growth of ${analytics.forecasting.forecast_summary.growth_rate.toFixed(1)}% based on current trends`,
        impact: 'high',
        recommendation: 'Prepare for scaling operations and inventory management'
      });
    }
    
    // Customer acquisition insights
    if (analytics.profitability.cac_analysis.length > 0) {
      const bestCAC = analytics.profitability.cac_analysis.reduce((prev, current) => 
        current.estimated_cac < prev.estimated_cac ? current : prev
      );
      
      insights.push({
        type: 'info',
        category: 'acquisition',
        title: 'Best Acquisition Channel',
        description: `${bestCAC.source} has the lowest customer acquisition cost at £${bestCAC.estimated_cac.toFixed(2)}`,
        impact: 'medium',
        recommendation: 'Increase investment in cost-effective acquisition channels'
      });
    }
    
    res.json({
      success: true,
      data: insights,
      timeframe,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting revenue insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue insights',
      message: error.message
    });
  }
});

/**
 * POST /api/revenue-intelligence/forecast
 * Generate custom revenue forecast
 */
router.post('/forecast', authenticateAdmin, async (req, res) => {
  try {
    const { 
      timeframe = '30d', 
      forecast_days = 30, 
      include_seasonality = true,
      confidence_level = 0.95
    } = req.body;
    
    const interval = revenueService.getIntervalFromTimeframe(timeframe);
    
    // Get historical data
    const historicalResult = await revenueService.db.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        SUM(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as bookings
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}' * 2
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `);
    
    // Generate forecast
    const forecastData = revenueService.generateForecast(historicalResult.rows, forecast_days);
    
    // Calculate seasonal adjustments if requested
    let seasonalForecast = forecastData;
    if (include_seasonality) {
      const seasonalPatterns = await revenueService.calculateSeasonalPatterns(interval);
      seasonalForecast = revenueService.applySeasonalAdjustments(forecastData, seasonalPatterns);
    }
    
    res.json({
      success: true,
      data: {
        historical_data: historicalResult.rows,
        forecast_data: seasonalForecast,
        forecast_summary: {
          total_forecast_revenue: seasonalForecast.reduce((sum, day) => sum + day.predicted_revenue, 0),
          avg_daily_revenue: seasonalForecast.reduce((sum, day) => sum + day.predicted_revenue, 0) / forecast_days,
          confidence_level: confidence_level,
          includes_seasonality: include_seasonality
        }
      },
      parameters: {
        timeframe,
        forecast_days,
        include_seasonality,
        confidence_level
      },
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating custom forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom forecast',
      message: error.message
    });
  }
});

/**
 * GET /api/revenue-intelligence/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await revenueService.db.query('SELECT 1');
    
    // Test Redis connection
    await revenueService.redis.ping();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        revenue_intelligence: 'operational'
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