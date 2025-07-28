/**
 * Revenue Intelligence Service
 * Advanced financial analytics and revenue forecasting
 * Part of Phase 8 R2.2 implementation
 */

const { Pool } = require('pg');
const Redis = require('redis');

/**
 * Revenue Intelligence Service
 * Financial analytics, forecasting, and business metrics
 */
class RevenueIntelligenceService {
  constructor() {
    // Initialize PostgreSQL connection
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5435,
      database: process.env.DB_NAME || 'revivatech_db',
      user: process.env.DB_USER || 'revivatech_user',
      password: process.env.DB_PASSWORD || 'revivatech_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis connection for caching
    this.redis = Redis.createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6383}`,
      password: process.env.REDIS_PASSWORD,
    });

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.connect();
  }

  /**
   * Get comprehensive revenue analytics
   */
  async getRevenueAnalytics(timeframe = '30d') {
    try {
      const interval = this.getIntervalFromTimeframe(timeframe);
      
      const [
        overview,
        trends,
        breakdown,
        forecasting,
        profitability,
        cohortAnalysis
      ] = await Promise.all([
        this.getRevenueOverview(interval),
        this.getRevenueTrends(interval),
        this.getRevenueBreakdown(interval),
        this.getRevenueForecasting(interval),
        this.getProfitabilityAnalysis(interval),
        this.getCohortAnalysis(interval)
      ]);

      return {
        overview,
        trends,
        breakdown,
        forecasting,
        profitability,
        cohort_analysis: cohortAnalysis,
        timeframe,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue overview metrics
   */
  async getRevenueOverview(interval) {
    const result = await this.db.query(`
      SELECT 
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as total_bookings,
        SUM(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as total_revenue,
        AVG(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_order_value,
        COUNT(DISTINCT CASE WHEN event_type = 'booking_completed' 
            THEN user_fingerprint ELSE NULL END) as paying_customers,
        COUNT(DISTINCT user_fingerprint) as total_customers,
        MIN(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as min_order_value,
        MAX(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as max_order_value
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
    `);

    const current = result.rows[0];

    // Get comparison data for previous period
    const previousResult = await this.db.query(`
      SELECT 
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as total_bookings,
        SUM(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as total_revenue,
        AVG(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_order_value,
        COUNT(DISTINCT CASE WHEN event_type = 'booking_completed' 
            THEN user_fingerprint ELSE NULL END) as paying_customers
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}' * 2
        AND created_at < NOW() - INTERVAL '${interval}'
    `);

    const previous = previousResult.rows[0];

    return {
      total_revenue: {
        current: parseFloat(current.total_revenue) || 0,
        previous: parseFloat(previous.total_revenue) || 0,
        change: this.calculatePercentageChange(current.total_revenue, previous.total_revenue)
      },
      total_bookings: {
        current: parseInt(current.total_bookings) || 0,
        previous: parseInt(previous.total_bookings) || 0,
        change: this.calculatePercentageChange(current.total_bookings, previous.total_bookings)
      },
      avg_order_value: {
        current: parseFloat(current.avg_order_value) || 0,
        previous: parseFloat(previous.avg_order_value) || 0,
        change: this.calculatePercentageChange(current.avg_order_value, previous.avg_order_value)
      },
      paying_customers: {
        current: parseInt(current.paying_customers) || 0,
        previous: parseInt(previous.paying_customers) || 0,
        change: this.calculatePercentageChange(current.paying_customers, previous.paying_customers)
      },
      conversion_rate: {
        current: current.total_customers > 0 ? (current.paying_customers / current.total_customers) * 100 : 0,
        previous: previous.total_customers > 0 ? (previous.paying_customers / previous.total_customers) * 100 : 0
      },
      order_stats: {
        min_order_value: parseFloat(current.min_order_value) || 0,
        max_order_value: parseFloat(current.max_order_value) || 0,
        median_order_value: await this.getMedianOrderValue(interval)
      }
    };
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(interval) {
    const groupBy = this.getGroupByFromInterval(interval);
    
    const result = await this.db.query(`
      SELECT 
        DATE_TRUNC('${groupBy}', created_at) as period,
        COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as bookings,
        SUM(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        AVG(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_order_value,
        COUNT(DISTINCT CASE WHEN event_type = 'booking_completed' 
            THEN user_fingerprint ELSE NULL END) as paying_customers
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('${groupBy}', created_at)
      ORDER BY period ASC
    `);

    // Calculate growth rates
    const trendsWithGrowth = result.rows.map((row, index) => {
      const previousRow = result.rows[index - 1];
      const revenueGrowth = previousRow ? 
        this.calculatePercentageChange(row.revenue, previousRow.revenue) : 0;
      const bookingsGrowth = previousRow ? 
        this.calculatePercentageChange(row.bookings, previousRow.bookings) : 0;

      return {
        period: row.period,
        bookings: parseInt(row.bookings) || 0,
        revenue: parseFloat(row.revenue) || 0,
        avg_order_value: parseFloat(row.avg_order_value) || 0,
        paying_customers: parseInt(row.paying_customers) || 0,
        revenue_growth: revenueGrowth,
        bookings_growth: bookingsGrowth,
        cumulative_revenue: this.calculateCumulativeRevenue(result.rows.slice(0, index + 1))
      };
    });

    return trendsWithGrowth;
  }

  /**
   * Get revenue breakdown by various dimensions
   */
  async getRevenueBreakdown(interval) {
    // Revenue by service type
    const serviceBreakdown = await this.db.query(`
      SELECT 
        event_data->>'service_type' as service_type,
        COUNT(*) as bookings,
        SUM(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        AVG(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_value,
        COUNT(DISTINCT user_fingerprint) as unique_customers
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
        AND event_data->>'service_type' IS NOT NULL
      GROUP BY event_data->>'service_type'
      ORDER BY revenue DESC
    `);

    // Revenue by device type
    const deviceBreakdown = await this.db.query(`
      SELECT 
        device_type,
        COUNT(*) as bookings,
        SUM(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        AVG(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_value
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
        AND device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY revenue DESC
    `);

    // Revenue by traffic source
    const sourceBreakdown = await this.db.query(`
      SELECT 
        COALESCE(utm_source, 'Direct') as source,
        COUNT(*) as bookings,
        SUM(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        AVG(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_value
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
      GROUP BY utm_source
      ORDER BY revenue DESC
    `);

    // Revenue by customer segment
    const segmentBreakdown = await this.db.query(`
      SELECT 
        ubp.customer_segment,
        COUNT(ae.*) as bookings,
        SUM(CASE WHEN ae.event_data->>'booking_value' IS NOT NULL 
            THEN (ae.event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        AVG(CASE WHEN ae.event_data->>'booking_value' IS NOT NULL 
            THEN (ae.event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_value,
        COUNT(DISTINCT ae.user_fingerprint) as unique_customers
      FROM analytics_events ae
      JOIN user_behavior_profiles ubp ON ae.user_fingerprint = ubp.user_fingerprint
      WHERE ae.created_at >= NOW() - INTERVAL '${interval}'
        AND ae.event_type = 'booking_completed'
        AND ubp.customer_segment IS NOT NULL
      GROUP BY ubp.customer_segment
      ORDER BY revenue DESC
    `);

    return {
      by_service: serviceBreakdown.rows,
      by_device: deviceBreakdown.rows,
      by_source: sourceBreakdown.rows,
      by_segment: segmentBreakdown.rows
    };
  }

  /**
   * Get revenue forecasting
   */
  async getRevenueForecasting(interval) {
    // Get historical data for forecasting
    const historicalData = await this.db.query(`
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

    // Simple linear regression for forecasting
    const forecast = this.calculateLinearForecast(historicalData.rows);
    
    // Calculate seasonal patterns
    const seasonalPatterns = await this.calculateSeasonalPatterns(interval);
    
    // Generate forecast for next 30 days
    const forecastDays = 30;
    const forecastData = this.generateForecast(historicalData.rows, forecastDays);

    return {
      historical_data: historicalData.rows,
      forecast_data: forecastData,
      seasonal_patterns: seasonalPatterns,
      forecast_summary: {
        next_30_days_revenue: forecastData.reduce((sum, day) => sum + day.predicted_revenue, 0),
        growth_rate: forecast.growth_rate,
        confidence_interval: forecast.confidence_interval,
        trend: forecast.trend
      }
    };
  }

  /**
   * Get profitability analysis
   */
  async getProfitabilityAnalysis(interval) {
    // Revenue by cost analysis (simplified - you'd need actual cost data)
    const profitabilityData = await this.db.query(`
      SELECT 
        event_data->>'service_type' as service_type,
        COUNT(*) as bookings,
        SUM(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue,
        AVG(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_revenue_per_booking
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
        AND event_data->>'service_type' IS NOT NULL
      GROUP BY event_data->>'service_type'
      ORDER BY revenue DESC
    `);

    // Calculate estimated profitability (using industry averages)
    const profitabilityWithMargins = profitabilityData.rows.map(row => {
      const estimatedCostRatio = this.getEstimatedCostRatio(row.service_type);
      const estimatedCost = row.revenue * estimatedCostRatio;
      const estimatedProfit = row.revenue - estimatedCost;
      const profitMargin = row.revenue > 0 ? (estimatedProfit / row.revenue) * 100 : 0;

      return {
        ...row,
        estimated_cost: estimatedCost,
        estimated_profit: estimatedProfit,
        profit_margin: profitMargin,
        cost_ratio: estimatedCostRatio
      };
    });

    // Customer acquisition cost (CAC) analysis
    const cacAnalysis = await this.calculateCustomerAcquisitionCost(interval);

    // Customer lifetime value (CLV) analysis
    const clvAnalysis = await this.calculateCustomerLifetimeValue(interval);

    return {
      service_profitability: profitabilityWithMargins,
      cac_analysis: cacAnalysis,
      clv_analysis: clvAnalysis,
      overall_metrics: {
        total_revenue: profitabilityWithMargins.reduce((sum, row) => sum + row.revenue, 0),
        total_estimated_profit: profitabilityWithMargins.reduce((sum, row) => sum + row.estimated_profit, 0),
        overall_profit_margin: this.calculateOverallProfitMargin(profitabilityWithMargins)
      }
    };
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(interval) {
    // Define cohorts by first booking month
    const cohortData = await this.db.query(`
      WITH first_bookings AS (
        SELECT 
          user_fingerprint,
          DATE_TRUNC('month', MIN(created_at)) as cohort_month,
          MIN(created_at) as first_booking_date
        FROM analytics_events 
        WHERE event_type = 'booking_completed'
        GROUP BY user_fingerprint
      ),
      monthly_bookings AS (
        SELECT 
          ae.user_fingerprint,
          DATE_TRUNC('month', ae.created_at) as booking_month,
          SUM(CASE WHEN ae.event_data->>'booking_value' IS NOT NULL 
              THEN (ae.event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue
        FROM analytics_events ae
        WHERE ae.event_type = 'booking_completed'
        GROUP BY ae.user_fingerprint, DATE_TRUNC('month', ae.created_at)
      )
      SELECT 
        fb.cohort_month,
        mb.booking_month,
        EXTRACT(MONTH FROM AGE(mb.booking_month, fb.cohort_month)) as period_number,
        COUNT(DISTINCT fb.user_fingerprint) as customers,
        SUM(mb.revenue) as revenue,
        AVG(mb.revenue) as avg_revenue_per_customer
      FROM first_bookings fb
      JOIN monthly_bookings mb ON fb.user_fingerprint = mb.user_fingerprint
      WHERE fb.cohort_month >= NOW() - INTERVAL '${interval}'
      GROUP BY fb.cohort_month, mb.booking_month
      ORDER BY fb.cohort_month, mb.booking_month
    `);

    // Calculate retention rates
    const retentionAnalysis = this.calculateRetentionRates(cohortData.rows);

    return {
      cohort_data: cohortData.rows,
      retention_analysis: retentionAnalysis,
      cohort_summary: this.summarizeCohortData(cohortData.rows)
    };
  }

  /**
   * Utility functions
   */
  getIntervalFromTimeframe(timeframe) {
    const timeframeMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year'
    };
    return timeframeMap[timeframe] || '30 days';
  }

  getGroupByFromInterval(interval) {
    if (interval.includes('day') && parseInt(interval) <= 7) return 'hour';
    if (interval.includes('day') && parseInt(interval) <= 30) return 'day';
    if (interval.includes('day') && parseInt(interval) <= 90) return 'week';
    return 'month';
  }

  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  async getMedianOrderValue(interval) {
    const result = await this.db.query(`
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (event_data->>'booking_value')::NUMERIC) as median_value
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
        AND event_data->>'booking_value' IS NOT NULL
    `);
    return parseFloat(result.rows[0]?.median_value) || 0;
  }

  calculateCumulativeRevenue(rows) {
    return rows.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0);
  }

  calculateLinearForecast(historicalData) {
    if (historicalData.length < 2) {
      return { growth_rate: 0, confidence_interval: 0, trend: 'insufficient_data' };
    }

    // Simple linear regression
    const n = historicalData.length;
    const sumX = historicalData.reduce((sum, _, index) => sum + index, 0);
    const sumY = historicalData.reduce((sum, row) => sum + parseFloat(row.revenue), 0);
    const sumXY = historicalData.reduce((sum, row, index) => sum + index * parseFloat(row.revenue), 0);
    const sumXX = historicalData.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const avgRevenue = sumY / n;
    const growthRate = avgRevenue > 0 ? (slope / avgRevenue) * 100 : 0;

    return {
      growth_rate: growthRate,
      confidence_interval: this.calculateConfidenceInterval(historicalData, slope, intercept),
      trend: growthRate > 5 ? 'growing' : growthRate < -5 ? 'declining' : 'stable'
    };
  }

  calculateConfidenceInterval(data, slope, intercept) {
    // Simplified confidence interval calculation
    const predictions = data.map((_, index) => slope * index + intercept);
    const residuals = data.map((row, index) => parseFloat(row.revenue) - predictions[index]);
    const mse = residuals.reduce((sum, residual) => sum + residual * residual, 0) / data.length;
    const standardError = Math.sqrt(mse);
    return standardError * 1.96; // 95% confidence interval
  }

  generateForecast(historicalData, days) {
    const forecast = this.calculateLinearForecast(historicalData);
    const baseDate = new Date();
    const forecastData = [];

    for (let i = 1; i <= days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      const predictedRevenue = Math.max(0, forecast.growth_rate * i + 
        (historicalData.length > 0 ? parseFloat(historicalData[historicalData.length - 1].revenue) : 0));

      forecastData.push({
        date: date.toISOString().split('T')[0],
        predicted_revenue: predictedRevenue,
        confidence_upper: predictedRevenue + forecast.confidence_interval,
        confidence_lower: Math.max(0, predictedRevenue - forecast.confidence_interval)
      });
    }

    return forecastData;
  }

  async calculateSeasonalPatterns(interval) {
    const result = await this.db.query(`
      SELECT 
        EXTRACT(DOW FROM created_at) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        AVG(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as avg_revenue
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
      GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
      ORDER BY day_of_week, hour_of_day
    `);

    return result.rows;
  }

  getEstimatedCostRatio(serviceType) {
    // Estimated cost ratios for different service types
    const costRatios = {
      'screen_repair': 0.4,
      'battery_replacement': 0.3,
      'data_recovery': 0.2,
      'virus_removal': 0.15,
      'hardware_repair': 0.5,
      'software_repair': 0.1
    };
    
    return costRatios[serviceType] || 0.35; // Default 35% cost ratio
  }

  async calculateCustomerAcquisitionCost(interval) {
    // Simplified CAC calculation (you'd need actual marketing spend data)
    const result = await this.db.query(`
      SELECT 
        COALESCE(utm_source, 'Direct') as source,
        COUNT(DISTINCT user_fingerprint) as new_customers,
        SUM(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as revenue
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY utm_source
      ORDER BY new_customers DESC
    `);

    // Estimated marketing spend by source (you'd replace with actual data)
    const estimatedSpend = {
      'google': 500,
      'facebook': 300,
      'instagram': 200,
      'Direct': 0
    };

    return result.rows.map(row => ({
      source: row.source,
      new_customers: parseInt(row.new_customers),
      estimated_spend: estimatedSpend[row.source] || 100,
      estimated_cac: (estimatedSpend[row.source] || 100) / Math.max(1, row.new_customers),
      revenue: parseFloat(row.revenue) || 0
    }));
  }

  async calculateCustomerLifetimeValue(interval) {
    const result = await this.db.query(`
      SELECT 
        user_fingerprint,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE 0 END) as total_revenue,
        AVG(CASE WHEN event_data->>'booking_value' IS NOT NULL 
            THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_order_value,
        MIN(created_at) as first_booking,
        MAX(created_at) as last_booking
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '${interval}'
        AND event_type = 'booking_completed'
      GROUP BY user_fingerprint
      HAVING COUNT(*) > 0
    `);

    const customers = result.rows.map(row => ({
      ...row,
      customer_lifespan_days: Math.ceil((new Date(row.last_booking) - new Date(row.first_booking)) / (1000 * 60 * 60 * 24)) || 1,
      revenue_per_day: (parseFloat(row.total_revenue) || 0) / Math.max(1, Math.ceil((new Date(row.last_booking) - new Date(row.first_booking)) / (1000 * 60 * 60 * 24)))
    }));

    return {
      customer_data: customers,
      avg_clv: customers.reduce((sum, customer) => sum + customer.total_revenue, 0) / customers.length,
      avg_lifespan_days: customers.reduce((sum, customer) => sum + customer.customer_lifespan_days, 0) / customers.length,
      avg_order_frequency: customers.reduce((sum, customer) => sum + customer.total_bookings, 0) / customers.length
    };
  }

  calculateOverallProfitMargin(profitabilityData) {
    const totalRevenue = profitabilityData.reduce((sum, row) => sum + row.revenue, 0);
    const totalProfit = profitabilityData.reduce((sum, row) => sum + row.estimated_profit, 0);
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  }

  calculateRetentionRates(cohortData) {
    const cohorts = {};
    
    cohortData.forEach(row => {
      const cohortKey = row.cohort_month;
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = { periods: {} };
      }
      
      cohorts[cohortKey].periods[row.period_number] = {
        customers: row.customers,
        revenue: row.revenue
      };
    });

    // Calculate retention rates
    Object.keys(cohorts).forEach(cohortKey => {
      const cohort = cohorts[cohortKey];
      const period0 = cohort.periods[0];
      
      if (period0) {
        cohort.initial_customers = period0.customers;
        
        Object.keys(cohort.periods).forEach(period => {
          const periodData = cohort.periods[period];
          periodData.retention_rate = (periodData.customers / cohort.initial_customers) * 100;
        });
      }
    });

    return cohorts;
  }

  summarizeCohortData(cohortData) {
    const totalCustomers = cohortData.reduce((sum, row) => sum + row.customers, 0);
    const totalRevenue = cohortData.reduce((sum, row) => sum + row.revenue, 0);
    
    return {
      total_customers: totalCustomers,
      total_revenue: totalRevenue,
      avg_revenue_per_customer: totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.redis.quit();
    await this.db.end();
  }
}

module.exports = RevenueIntelligenceService;