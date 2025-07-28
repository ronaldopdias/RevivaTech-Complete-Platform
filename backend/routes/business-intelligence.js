/**
 * Business Intelligence API Routes
 * Advanced analytics dashboard and custom reporting endpoints
 * Part of Phase 8 R2 implementation
 */

const express = require('express');
const BusinessIntelligenceService = require('../services/BusinessIntelligenceService');

const router = express.Router();

// Initialize Business Intelligence Service
const biService = new BusinessIntelligenceService();

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
 * GET /api/business-intelligence/dashboard
 * Get comprehensive dashboard metrics
 */
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    const metrics = await biService.getDashboardMetrics(timeframe);
    
    res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/business-intelligence/realtime
 * Get real-time analytics metrics
 */
router.get('/realtime', authenticateAdmin, async (req, res) => {
  try {
    const metrics = await biService.getRealtimeMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('Error getting realtime metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get realtime metrics',
      message: error.message
    });
  }
});

/**
 * POST /api/business-intelligence/reports/generate
 * Generate custom report
 */
router.post('/reports/generate', authenticateAdmin, async (req, res) => {
  try {
    const reportConfig = req.body;
    
    // Validate required fields
    if (!reportConfig.name || !reportConfig.metrics || !reportConfig.dimensions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, metrics, dimensions'
      });
    }
    
    // Validate metrics
    const allowedMetrics = [
      'unique_visitors', 'total_events', 'page_views', 'bookings', 
      'revenue', 'avg_session_duration', 'bounce_rate'
    ];
    const invalidMetrics = reportConfig.metrics.filter(m => !allowedMetrics.includes(m));
    if (invalidMetrics.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid metrics: ${invalidMetrics.join(', ')}`
      });
    }
    
    // Validate dimensions
    const allowedDimensions = [
      'date', 'hour', 'page_url', 'event_type', 'device_type', 
      'utm_source', 'service_type'
    ];
    const invalidDimensions = reportConfig.dimensions.filter(d => !allowedDimensions.includes(d));
    if (invalidDimensions.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid dimensions: ${invalidDimensions.join(', ')}`
      });
    }
    
    // Set defaults
    reportConfig.timeframe = reportConfig.timeframe || '7d';
    reportConfig.filters = reportConfig.filters || [];
    
    const report = await biService.generateCustomReport(reportConfig);
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom report',
      message: error.message
    });
  }
});

/**
 * GET /api/business-intelligence/reports/templates
 * Get predefined report templates
 */
router.get('/reports/templates', authenticateAdmin, async (req, res) => {
  try {
    const templates = [
      {
        id: 'traffic_overview',
        name: 'Traffic Overview',
        description: 'Comprehensive traffic analysis with sources and behavior',
        metrics: ['unique_visitors', 'page_views', 'bounce_rate'],
        dimensions: ['date', 'utm_source', 'device_type'],
        timeframe: '30d',
        category: 'traffic'
      },
      {
        id: 'conversion_analysis',
        name: 'Conversion Analysis',
        description: 'Detailed conversion funnel and booking performance',
        metrics: ['unique_visitors', 'bookings', 'revenue'],
        dimensions: ['date', 'service_type'],
        timeframe: '30d',
        category: 'conversion'
      },
      {
        id: 'revenue_report',
        name: 'Revenue Report',
        description: 'Financial performance and revenue trends',
        metrics: ['revenue', 'bookings'],
        dimensions: ['date', 'service_type'],
        timeframe: '90d',
        category: 'revenue'
      },
      {
        id: 'page_performance',
        name: 'Page Performance',
        description: 'Page-level analytics and user engagement',
        metrics: ['page_views', 'avg_session_duration', 'bounce_rate'],
        dimensions: ['page_url'],
        timeframe: '7d',
        category: 'performance'
      },
      {
        id: 'hourly_activity',
        name: 'Hourly Activity',
        description: 'Hour-by-hour activity patterns',
        metrics: ['unique_visitors', 'total_events'],
        dimensions: ['hour'],
        timeframe: '7d',
        category: 'temporal'
      },
      {
        id: 'service_popularity',
        name: 'Service Popularity',
        description: 'Service interest and booking analysis',
        metrics: ['total_events', 'bookings', 'revenue'],
        dimensions: ['service_type'],
        timeframe: '30d',
        category: 'services'
      }
    ];
    
    res.json({
      success: true,
      data: templates
    });
    
  } catch (error) {
    console.error('Error getting report templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report templates',
      message: error.message
    });
  }
});

/**
 * POST /api/business-intelligence/reports/template/:templateId
 * Generate report from template
 */
router.post('/reports/template/:templateId', authenticateAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { timeframe, filters = [] } = req.body;
    
    // Get template configuration
    const templates = {
      traffic_overview: {
        name: 'Traffic Overview',
        description: 'Comprehensive traffic analysis with sources and behavior',
        metrics: ['unique_visitors', 'page_views', 'bounce_rate'],
        dimensions: ['date', 'utm_source', 'device_type'],
        timeframe: timeframe || '30d',
        filters
      },
      conversion_analysis: {
        name: 'Conversion Analysis',
        description: 'Detailed conversion funnel and booking performance',
        metrics: ['unique_visitors', 'bookings', 'revenue'],
        dimensions: ['date', 'service_type'],
        timeframe: timeframe || '30d',
        filters
      },
      revenue_report: {
        name: 'Revenue Report',
        description: 'Financial performance and revenue trends',
        metrics: ['revenue', 'bookings'],
        dimensions: ['date', 'service_type'],
        timeframe: timeframe || '90d',
        filters
      },
      page_performance: {
        name: 'Page Performance',
        description: 'Page-level analytics and user engagement',
        metrics: ['page_views', 'avg_session_duration', 'bounce_rate'],
        dimensions: ['page_url'],
        timeframe: timeframe || '7d',
        filters
      },
      hourly_activity: {
        name: 'Hourly Activity',
        description: 'Hour-by-hour activity patterns',
        metrics: ['unique_visitors', 'total_events'],
        dimensions: ['hour'],
        timeframe: timeframe || '7d',
        filters
      },
      service_popularity: {
        name: 'Service Popularity',
        description: 'Service interest and booking analysis',
        metrics: ['total_events', 'bookings', 'revenue'],
        dimensions: ['service_type'],
        timeframe: timeframe || '30d',
        filters
      }
    };
    
    const template = templates[templateId];
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const report = await biService.generateCustomReport(template);
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Error generating template report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template report',
      message: error.message
    });
  }
});

/**
 * GET /api/business-intelligence/reports/:reportId
 * Get cached report
 */
router.get('/reports/:reportId', authenticateAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await biService.getCachedReport(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or expired'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Error getting cached report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cached report',
      message: error.message
    });
  }
});

/**
 * GET /api/business-intelligence/kpis
 * Get key performance indicators
 */
router.get('/kpis', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Get dashboard metrics
    const metrics = await biService.getDashboardMetrics(timeframe);
    
    // Calculate KPIs
    const kpis = {
      customer_acquisition: {
        name: 'Customer Acquisition Rate',
        value: metrics.overview.unique_visitors.current,
        change: metrics.overview.unique_visitors.change,
        unit: 'visitors',
        target: 1000,
        status: metrics.overview.unique_visitors.current >= 1000 ? 'good' : 'warning'
      },
      conversion_rate: {
        name: 'Conversion Rate',
        value: metrics.overview.conversion_rate.current,
        change: metrics.overview.conversion_rate.current - metrics.overview.conversion_rate.previous,
        unit: '%',
        target: 5.0,
        status: metrics.overview.conversion_rate.current >= 5.0 ? 'good' : 'warning'
      },
      revenue_growth: {
        name: 'Revenue Growth',
        value: metrics.revenue?.overview?.total_revenue || 0,
        change: 0, // TODO: Calculate revenue change
        unit: '£',
        target: 10000,
        status: 'good'
      },
      customer_satisfaction: {
        name: 'Customer Satisfaction',
        value: 4.5, // TODO: Calculate from feedback
        change: 0.1,
        unit: '/5',
        target: 4.0,
        status: 'good'
      },
      average_order_value: {
        name: 'Average Order Value',
        value: metrics.revenue?.overview?.avg_order_value || 0,
        change: 0, // TODO: Calculate AOV change
        unit: '£',
        target: 200,
        status: 'good'
      },
      customer_retention: {
        name: 'Customer Retention',
        value: 75, // TODO: Calculate from customer data
        change: 2,
        unit: '%',
        target: 80,
        status: 'warning'
      }
    };
    
    res.json({
      success: true,
      data: kpis,
      timeframe,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get KPIs',
      message: error.message
    });
  }
});

/**
 * GET /api/business-intelligence/insights
 * Get automated business insights
 */
router.get('/insights', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Get dashboard metrics
    const metrics = await biService.getDashboardMetrics(timeframe);
    
    const insights = [];
    
    // Traffic insights
    if (metrics.overview.unique_visitors.change > 20) {
      insights.push({
        type: 'positive',
        category: 'traffic',
        title: 'Traffic Surge Detected',
        description: `Unique visitors increased by ${metrics.overview.unique_visitors.change.toFixed(1)}% compared to previous period`,
        impact: 'high',
        recommendation: 'Investigate traffic sources and optimize conversion for increased visitors'
      });
    }
    
    // Conversion insights
    if (metrics.overview.conversion_rate.current < 2) {
      insights.push({
        type: 'warning',
        category: 'conversion',
        title: 'Low Conversion Rate',
        description: `Current conversion rate is ${metrics.overview.conversion_rate.current.toFixed(2)}%, below industry average`,
        impact: 'high',
        recommendation: 'Review booking process and implement conversion optimization strategies'
      });
    }
    
    // Bounce rate insights
    if (metrics.overview.bounce_rate.current > 60) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'High Bounce Rate',
        description: `Bounce rate is ${metrics.overview.bounce_rate.current.toFixed(1)}%, indicating potential UX issues`,
        impact: 'medium',
        recommendation: 'Analyze top landing pages and improve user experience'
      });
    }
    
    // Revenue insights
    if (metrics.revenue?.overview?.total_revenue > 0) {
      const totalRevenue = metrics.revenue.overview.total_revenue;
      if (totalRevenue > 5000) {
        insights.push({
          type: 'positive',
          category: 'revenue',
          title: 'Strong Revenue Performance',
          description: `Generated £${totalRevenue.toFixed(2)} in revenue during this period`,
          impact: 'high',
          recommendation: 'Continue successful strategies and explore expansion opportunities'
        });
      }
    }
    
    // Device insights
    if (metrics.traffic?.devices) {
      const mobileUsers = metrics.traffic.devices.find(d => d.device_type === 'mobile');
      if (mobileUsers && mobileUsers.visitors > metrics.overview.unique_visitors.current * 0.6) {
        insights.push({
          type: 'info',
          category: 'technical',
          title: 'Mobile-First Audience',
          description: `${((mobileUsers.visitors / metrics.overview.unique_visitors.current) * 100).toFixed(1)}% of visitors use mobile devices`,
          impact: 'medium',
          recommendation: 'Ensure mobile experience is optimized for conversions'
        });
      }
    }
    
    res.json({
      success: true,
      data: insights,
      timeframe,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insights',
      message: error.message
    });
  }
});

/**
 * GET /api/business-intelligence/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await biService.db.query('SELECT 1');
    
    // Test Redis connection
    await biService.redis.ping();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        business_intelligence: 'operational'
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