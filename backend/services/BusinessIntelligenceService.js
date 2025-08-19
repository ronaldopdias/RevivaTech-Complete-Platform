/**
 * Business Intelligence Service
 * Advanced analytics dashboard and custom reporting system
 * Part of Phase 8 R2 implementation
 */

const { Pool } = require('pg');
const Redis = require('redis');
const WebSocket = require('ws');

/**
 * Business Intelligence Service
 * Real-time analytics, custom reports, and business metrics
 */
class BusinessIntelligenceService {
  constructor() {
    // Initialize PostgreSQL connection
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5435,
      database: process.env.DB_NAME || 'revivatech',
      user: process.env.DB_USER || 'revivatech',
      password: process.env.DB_PASSWORD || 'revivatech_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis connection for caching
    const redisConfig = {
      url: `redis://localhost:${process.env.REDIS_PORT || 6383}`
    };
    this.redis = Redis.createClient(redisConfig);

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.connect();

    // Real-time metrics cache
    this.metricsCache = new Map();
    this.updateInterval = 30000; // 30 seconds

    // Start real-time metrics collection
    this.startRealtimeMetrics();
  }

  /**
   * Start real-time metrics collection
   */
  startRealtimeMetrics() {
    setInterval(async () => {
      try {
        await this.updateRealtimeMetrics();
      } catch (error) {
        console.error('Error updating realtime metrics:', error);
      }
    }, this.updateInterval);
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(timeframe = '24h') {
    try {
      const [
        overviewMetrics,
        trafficMetrics,
        conversionMetrics,
        revenueMetrics,
        customerMetrics,
        performanceMetrics
      ] = await Promise.all([
        this.getOverviewMetrics(timeframe),
        this.getTrafficMetrics(timeframe),
        this.getConversionMetrics(timeframe),
        this.getRevenueMetrics(timeframe),
        this.getCustomerMetrics(timeframe),
        this.getPerformanceMetrics(timeframe)
      ]);

      return {
        overview: overviewMetrics,
        traffic: trafficMetrics,
        conversion: conversionMetrics,
        revenue: revenueMetrics,
        customers: customerMetrics,
        performance: performanceMetrics,
        timestamp: new Date().toISOString(),
        timeframe
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    
    const result = await this.db.query(`
      SELECT 
        COUNT(DISTINCT user_fingerprint) as unique_visitors,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as bookings,
        COUNT(CASE WHEN event_type = 'contact_interaction' THEN 1 END) as contacts,
        AVG(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as avg_pages_per_session,
        COUNT(CASE WHEN event_type = 'exit_intent' THEN 1 END) as exit_intents
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
    `);

    const current = result.rows[0];

    // Get comparison data for previous period
    const previousResult = await this.db.query(`
      SELECT 
        COUNT(DISTINCT user_fingerprint) as unique_visitors,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as bookings
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}' * 2
        AND created_at < NOW() - INTERVAL '${interval}'
    `);

    const previous = previousResult.rows[0];

    return {
      unique_visitors: {
        current: parseInt(current.unique_visitors),
        previous: parseInt(previous.unique_visitors),
        change: this.calculatePercentageChange(current.unique_visitors, previous.unique_visitors)
      },
      total_sessions: {
        current: parseInt(current.total_sessions),
        previous: parseInt(previous.total_sessions),
        change: this.calculatePercentageChange(current.total_sessions, previous.total_sessions)
      },
      page_views: {
        current: parseInt(current.page_views),
        previous: parseInt(previous.page_views) || 0,
        change: this.calculatePercentageChange(current.page_views, previous.page_views)
      },
      bookings: {
        current: parseInt(current.bookings),
        previous: parseInt(previous.bookings),
        change: this.calculatePercentageChange(current.bookings, previous.bookings)
      },
      conversion_rate: {
        current: current.total_sessions > 0 ? (current.bookings / current.total_sessions) * 100 : 0,
        previous: previous.total_sessions > 0 ? (previous.bookings / previous.total_sessions) * 100 : 0
      },
      bounce_rate: {
        current: current.total_sessions > 0 ? (current.exit_intents / current.total_sessions) * 100 : 0
      }
    };
  }

  /**
   * Get traffic metrics
   */
  async getTrafficMetrics(timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    
    // Traffic sources
    const sourcesResult = await this.db.query(`
      SELECT 
        COALESCE(utm_source, 'Direct') as source,
        COUNT(DISTINCT user_fingerprint) as visitors,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(*) as events
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'page_view'
      GROUP BY utm_source
      ORDER BY visitors DESC
      LIMIT 10
    `);

    // Top pages
    const pagesResult = await this.db.query(`
      SELECT 
        page_url,
        COUNT(*) as views,
        COUNT(DISTINCT user_fingerprint) as unique_visitors,
        AVG(CASE WHEN event_data->>'time_on_page' IS NOT NULL 
            THEN (event_data->>'time_on_page')::INTEGER ELSE NULL END) as avg_time_on_page
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'page_view'
      GROUP BY page_url
      ORDER BY views DESC
      LIMIT 10
    `);

    // Device breakdown
    const devicesResult = await this.db.query(`
      SELECT 
        device_type,
        COUNT(DISTINCT user_fingerprint) as visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'page_view'
      GROUP BY device_type
      ORDER BY visitors DESC
    `);

    // Hourly traffic pattern
    const hourlyResult = await this.db.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(DISTINCT user_fingerprint) as visitors,
        COUNT(*) as events
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'page_view'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `);

    return {
      sources: sourcesResult.rows,
      top_pages: pagesResult.rows,
      devices: devicesResult.rows,
      hourly_pattern: hourlyResult.rows
    };
  }

  /**
   * Get conversion metrics
   */
  async getConversionMetrics(timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    
    // Conversion funnel
    const funnelResult = await this.db.query(`
      SELECT 
        funnel_name,
        step_name,
        step_number,
        COUNT(DISTINCT user_fingerprint) as users_entered,
        COUNT(CASE WHEN completed_step THEN 1 END) as users_completed,
        COUNT(CASE WHEN dropped_off THEN 1 END) as users_dropped,
        AVG(time_in_step_seconds) as avg_time_in_step
      FROM conversion_funnels 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY funnel_name, step_name, step_number
      ORDER BY funnel_name, step_number
    `);

    // Service interest to booking conversion
    const serviceConversionResult = await this.db.query(`
      SELECT 
        event_data->>'service_type' as service_type,
        COUNT(CASE WHEN event_type = 'service_interest' THEN 1 END) as interest_events,
        COUNT(CASE WHEN event_type = 'booking_started' THEN 1 END) as booking_starts,
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as booking_completions
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type IN ('service_interest', 'booking_started', 'booking_completed')
        AND event_data->>'service_type' IS NOT NULL
      GROUP BY event_data->>'service_type'
      ORDER BY interest_events DESC
    `);

    // Goal completions
    const goalsResult = await this.db.query(`
      SELECT 
        event_type,
        COUNT(*) as completions,
        COUNT(DISTINCT user_fingerprint) as unique_users
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type IN ('booking_completed', 'contact_interaction', 'pricing_viewed', 'service_comparison')
      GROUP BY event_type
      ORDER BY completions DESC
    `);

    return {
      funnel: funnelResult.rows,
      service_conversion: serviceConversionResult.rows,
      goals: goalsResult.rows
    };
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    
    // Revenue overview
    const revenueResult = await this.db.query(`
      SELECT 
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as total_bookings,
        SUM(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as total_revenue,
        AVG(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_order_value,
        COUNT(DISTINCT CASE WHEN event_type = 'booking_completed' 
            THEN user_fingerprint ELSE NULL END) as paying_customers
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
    `);

    // Revenue by service type
    const serviceRevenueResult = await this.db.query(`
      SELECT 
        event_data->>'service_type' as service_type,
        COUNT(*) as bookings,
        SUM(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        AVG(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_value
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
        AND event_data->>'service_type' IS NOT NULL
      GROUP BY event_data->>'service_type'
      ORDER BY revenue DESC
    `);

    // Daily revenue trend
    const dailyRevenueResult = await this.db.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as bookings,
        SUM(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `);

    return {
      overview: revenueResult.rows[0],
      by_service: serviceRevenueResult.rows,
      daily_trend: dailyRevenueResult.rows
    };
  }

  /**
   * Get customer metrics
   */
  async getCustomerMetrics(timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    
    // Customer segments
    const segmentsResult = await this.db.query(`
      SELECT 
        customer_segment,
        COUNT(*) as count,
        AVG(engagement_score) as avg_engagement,
        AVG(lead_score) as avg_lead_score,
        AVG(total_booking_value) as avg_booking_value
      FROM user_behavior_profiles 
      WHERE last_seen_at >= NOW() - INTERVAL '${interval}'
      GROUP BY customer_segment
      ORDER BY count DESC
    `);

    // New vs returning customers
    const customerTypeResult = await this.db.query(`
      SELECT 
        CASE 
          WHEN total_sessions = 1 THEN 'New'
          ELSE 'Returning'
        END as customer_type,
        COUNT(*) as count,
        AVG(engagement_score) as avg_engagement
      FROM user_behavior_profiles 
      WHERE last_seen_at >= NOW() - INTERVAL '${interval}'
      GROUP BY CASE WHEN total_sessions = 1 THEN 'New' ELSE 'Returning' END
    `);

    // Customer lifetime value distribution
    const clvResult = await this.db.query(`
      SELECT 
        CASE 
          WHEN total_booking_value = 0 THEN '£0'
          WHEN total_booking_value <= 100 THEN '£1-100'
          WHEN total_booking_value <= 300 THEN '£101-300'
          WHEN total_booking_value <= 500 THEN '£301-500'
          WHEN total_booking_value <= 1000 THEN '£501-1000'
          ELSE '£1000+'
        END as value_range,
        COUNT(*) as customers
      FROM user_behavior_profiles 
      WHERE last_seen_at >= NOW() - INTERVAL '${interval}'
      GROUP BY CASE 
        WHEN total_booking_value = 0 THEN '£0'
        WHEN total_booking_value <= 100 THEN '£1-100'
        WHEN total_booking_value <= 300 THEN '£101-300'
        WHEN total_booking_value <= 500 THEN '£301-500'
        WHEN total_booking_value <= 1000 THEN '£501-1000'
        ELSE '£1000+'
      END
      ORDER BY MIN(total_booking_value)
    `);

    return {
      segments: segmentsResult.rows,
      customer_types: customerTypeResult.rows,
      clv_distribution: clvResult.rows
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    
    // Page performance
    const performanceResult = await this.db.query(`
      SELECT 
        page_url,
        COUNT(*) as views,
        AVG(CASE WHEN event_data->>'page_load_time' IS NOT NULL 
            THEN (event_data->>'page_load_time')::INTEGER ELSE NULL END) as avg_load_time,
        AVG(CASE WHEN event_data->>'time_on_page' IS NOT NULL 
            THEN (event_data->>'time_on_page')::INTEGER ELSE NULL END) as avg_time_on_page,
        COUNT(CASE WHEN event_data->>'bounce' = 'true' THEN 1 END) as bounces
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'page_view'
      GROUP BY page_url
      HAVING COUNT(*) >= 10
      ORDER BY views DESC
      LIMIT 20
    `);

    // Error tracking
    const errorsResult = await this.db.query(`
      SELECT 
        event_data->>'error_type' as error_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_fingerprint) as affected_users
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'error'
        AND event_data->>'error_type' IS NOT NULL
      GROUP BY event_data->>'error_type'
      ORDER BY count DESC
    `);

    return {
      page_performance: performanceResult.rows,
      errors: errorsResult.rows,
      system_health: {
        uptime: 99.9, // TODO: Implement actual uptime tracking
        response_time: 150, // TODO: Implement actual response time tracking
        error_rate: 0.01 // TODO: Calculate actual error rate
      }
    };
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(reportConfig) {
    try {
      const {
        name,
        description,
        metrics,
        dimensions,
        filters,
        timeframe,
        format = 'json'
      } = reportConfig;

      console.log(`Generating custom report: ${name}`);

      // Build dynamic query based on configuration
      const query = this.buildCustomReportQuery(metrics, dimensions, filters, timeframe);
      
      // Execute query
      const result = await this.db.query(query.sql, query.params);
      
      // Format results
      const formattedData = this.formatReportData(result.rows, metrics, dimensions);
      
      // Generate summary statistics
      const summary = this.generateReportSummary(formattedData, metrics);
      
      const report = {
        name,
        description,
        generated_at: new Date().toISOString(),
        timeframe,
        config: reportConfig,
        summary,
        data: formattedData,
        total_rows: result.rows.length
      };

      // Cache report for future access
      await this.cacheReport(report);

      return report;

    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  }

  /**
   * Build custom report query
   */
  buildCustomReportQuery(metrics, dimensions, filters, timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    let selectClauses = [];
    let groupByClauses = [];
    let whereClauses = [`created_at >= NOW() - INTERVAL '${interval}'`];
    let params = [];

    // Add dimensions to SELECT and GROUP BY
    dimensions.forEach(dimension => {
      switch (dimension) {
        case 'date':
          selectClauses.push("DATE_TRUNC('day', created_at) as date");
          groupByClauses.push("DATE_TRUNC('day', created_at)");
          break;
        case 'hour':
          selectClauses.push("EXTRACT(HOUR FROM created_at) as hour");
          groupByClauses.push("EXTRACT(HOUR FROM created_at)");
          break;
        case 'page_url':
          selectClauses.push('page_url');
          groupByClauses.push('page_url');
          break;
        case 'event_type':
          selectClauses.push('event_type');
          groupByClauses.push('event_type');
          break;
        case 'device_type':
          selectClauses.push('device_type');
          groupByClauses.push('device_type');
          break;
        case 'utm_source':
          selectClauses.push('utm_source');
          groupByClauses.push('utm_source');
          break;
        case 'service_type':
          selectClauses.push("event_data->>'service_type' as service_type");
          groupByClauses.push("event_data->>'service_type'");
          break;
      }
    });

    // Add metrics to SELECT
    metrics.forEach(metric => {
      switch (metric) {
        case 'unique_visitors':
          selectClauses.push('COUNT(DISTINCT user_fingerprint) as unique_visitors');
          break;
        case 'total_events':
          selectClauses.push('COUNT(*) as total_events');
          break;
        case 'page_views':
          selectClauses.push("COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views");
          break;
        case 'bookings':
          selectClauses.push("COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as bookings");
          break;
        case 'revenue':
          selectClauses.push(`SUM(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue`);
          break;
        case 'avg_session_duration':
          selectClauses.push("AVG(CASE WHEN event_data->>'session_duration' IS NOT NULL THEN (event_data->>'session_duration')::INTEGER ELSE NULL END) as avg_session_duration");
          break;
        case 'bounce_rate':
          selectClauses.push("(COUNT(CASE WHEN event_type = 'exit_intent' THEN 1 END)::NUMERIC / COUNT(DISTINCT session_id)::NUMERIC) * 100 as bounce_rate");
          break;
      }
    });

    // Add filters
    filters.forEach(filter => {
      switch (filter.field) {
        case 'event_type':
          whereClauses.push(`event_type = $${params.length + 1}`);
          params.push(filter.value);
          break;
        case 'page_url':
          whereClauses.push(`page_url ILIKE $${params.length + 1}`);
          params.push(`%${filter.value}%`);
          break;
        case 'device_type':
          whereClauses.push(`device_type = $${params.length + 1}`);
          params.push(filter.value);
          break;
        case 'utm_source':
          whereClauses.push(`utm_source = $${params.length + 1}`);
          params.push(filter.value);
          break;
      }
    });

    const sql = `
      SELECT ${selectClauses.join(', ')}
      FROM analytics_events
      WHERE ${whereClauses.join(' AND ')}
      ${groupByClauses.length > 0 ? `GROUP BY ${groupByClauses.join(', ')}` : ''}
      ORDER BY ${dimensions.length > 0 ? dimensions[0] : 'created_at'} DESC
      LIMIT 1000
    `;

    return { sql, params };
  }

  /**
   * Format report data
   */
  formatReportData(rows, metrics, dimensions) {
    return rows.map(row => {
      const formattedRow = {};
      
      // Format dimensions
      dimensions.forEach(dimension => {
        formattedRow[dimension] = row[dimension];
      });
      
      // Format metrics
      metrics.forEach(metric => {
        const value = row[metric];
        if (value !== null && value !== undefined) {
          if (metric === 'revenue') {
            formattedRow[metric] = parseFloat(value).toFixed(2);
          } else if (metric.includes('rate') || metric.includes('percentage')) {
            formattedRow[metric] = parseFloat(value).toFixed(2);
          } else {
            formattedRow[metric] = parseInt(value) || 0;
          }
        } else {
          formattedRow[metric] = 0;
        }
      });
      
      return formattedRow;
    });
  }

  /**
   * Generate report summary
   */
  generateReportSummary(data, metrics) {
    const summary = {};
    
    metrics.forEach(metric => {
      const values = data.map(row => parseFloat(row[metric]) || 0);
      
      summary[metric] = {
        total: values.reduce((sum, val) => sum + val, 0),
        average: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });
    
    return summary;
  }

  /**
   * Cache report
   */
  async cacheReport(report) {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      await this.redis.setEx(
        `report:${reportId}`,
        3600, // 1 hour
        JSON.stringify(report)
      );
      return reportId;
    } catch (error) {
      console.error('Error caching report:', error);
    }
  }

  /**
   * Get cached report
   */
  async getCachedReport(reportId) {
    try {
      const cached = await this.redis.get(`report:${reportId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached report:', error);
      return null;
    }
  }

  /**
   * Update realtime metrics
   */
  async updateRealtimeMetrics() {
    try {
      // Get current metrics
      const metrics = await this.getDashboardMetrics('1h');
      
      // Update cache
      this.metricsCache.set('realtime', metrics);
      
      // Cache in Redis
      await this.redis.setEx(
        'realtime_metrics',
        60, // 1 minute
        JSON.stringify(metrics)
      );
      
      // Broadcast to WebSocket clients if available
      if (this.wsClients) {
        this.wsClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'realtime_metrics_update',
              data: metrics
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error updating realtime metrics:', error);
    }
  }

  /**
   * Get realtime metrics
   */
  async getRealtimeMetrics() {
    try {
      // Try cache first
      const cached = this.metricsCache.get('realtime');
      if (cached) {
        return cached;
      }
      
      // Try Redis
      const redisCached = await this.redis.get('realtime_metrics');
      if (redisCached) {
        const metrics = JSON.parse(redisCached);
        this.metricsCache.set('realtime', metrics);
        return metrics;
      }
      
      // Generate fresh metrics
      const metrics = await this.getDashboardMetrics('1h');
      this.metricsCache.set('realtime', metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting realtime metrics:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  getIntervalFromTimeframe(timeframe) {
    const timeframeMap = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year'
    };
    return timeframeMap[timeframe] || '24 hours';
  }

  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Set WebSocket clients reference
   */
  setWebSocketClients(clients) {
    this.wsClients = clients;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.redis.quit();
    await this.db.end();
  }
}

module.exports = BusinessIntelligenceService;