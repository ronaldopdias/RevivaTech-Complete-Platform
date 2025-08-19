const { Pool } = require('pg');
const Redis = require('redis');
const crypto = require('crypto');

/**
 * AnalyticsService - Core service for processing analytics events, user behavior tracking, and ML features
 * Implements real-time event processing, customer insights, and predictive analytics
 */
class AnalyticsService {
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

    // Event queue for batch processing
    this.eventQueue = [];
    this.batchSize = 100;
    this.flushInterval = 5000; // 5 seconds

    // Start batch processing
    this.startBatchProcessing();
  }

  /**
   * Process incoming analytics event
   * @param {Object} eventData - Event data including fingerprint, session, type, etc.
   * @returns {Promise<Object>} - Processed event result
   */
  async processEvent(eventData) {
    try {
      // Validate event data
      if (!eventData.user_fingerprint || !eventData.session_id || !eventData.event_type) {
        throw new Error('Missing required event fields');
      }

      // Add timestamp and event ID
      const event = {
        id: crypto.randomUUID(),
        ...eventData,
        created_at: new Date().toISOString(),
        processed_at: null
      };

      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Process immediately if queue is full
      if (this.eventQueue.length >= this.batchSize) {
        await this.flushEventQueue();
      }

      // Update real-time metrics in Redis
      await this.updateRealtimeMetrics(event);

      // Update user behavior profile asynchronously
      this.updateUserProfile(event.user_fingerprint, event, event.session_id).catch(console.error);

      return { success: true, eventId: event.id };
    } catch (error) {
      console.error('Error processing event:', error);
      throw error;
    }
  }

  /**
   * Store event in database
   * @param {string} fingerprint - User fingerprint
   * @param {string} sessionId - Session ID
   * @param {Object} event - Event data
   */
  async storeEvent(fingerprint, sessionId, event) {
    const query = `
      INSERT INTO analytics_events (
        id, user_fingerprint, session_id, user_id, event_type, event_name,
        event_data, page_url, referrer_url, utm_source, utm_medium, utm_campaign,
        device_type, browser, os, screen_resolution, ip_address, geo_country, geo_city,
        created_at, processed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
    `;

    const values = [
      event.id,
      fingerprint,
      sessionId,
      event.user_id || null,
      event.event_type,
      event.event_name || event.event_type,
      JSON.stringify(event.event_data || {}),
      event.page_url,
      event.referrer_url,
      event.utm_source,
      event.utm_medium,
      event.utm_campaign,
      event.device_type,
      event.browser,
      event.os,
      event.screen_resolution,
      event.ip_address,
      event.geo_country,
      event.geo_city,
      event.created_at,
      new Date().toISOString()
    ];

    await this.db.query(query, values);
  }

  /**
   * Batch process events from queue
   */
  async flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Begin transaction
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');

        // Batch insert events
        for (const event of events) {
          await this.storeEvent(
            event.user_fingerprint,
            event.session_id,
            event
          );
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      console.log(`Successfully processed ${events.length} events`);
    } catch (error) {
      console.error('Error flushing event queue:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start batch processing timer
   */
  startBatchProcessing() {
    setInterval(() => {
      this.flushEventQueue().catch(console.error);
    }, this.flushInterval);
  }

  /**
   * Update user behavior profile based on event
   * @param {string} fingerprint - User fingerprint
   * @param {Object} event - Event data
   * @param {string} sessionId - Session ID
   */
  async updateUserProfile(fingerprint, event, sessionId) {
    try {
      // Check if profile exists
      const profileResult = await this.db.query(
        'SELECT * FROM user_behavior_profiles WHERE user_fingerprint = $1',
        [fingerprint]
      );

      if (profileResult.rows.length === 0) {
        // Create new profile
        await this.createUserProfile(fingerprint, event.user_id);
      }

      // Update profile metrics based on event type
      const updates = this.calculateProfileUpdates(event);
      
      if (Object.keys(updates).length > 0) {
        const updateQuery = this.buildUpdateQuery(updates, fingerprint);
        await this.db.query(updateQuery.query, updateQuery.values);
      }

      // Update ML scores
      await this.updateMLScores(fingerprint);

    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  /**
   * Create new user behavior profile
   */
  async createUserProfile(fingerprint, userId = null) {
    const query = `
      INSERT INTO user_behavior_profiles (
        user_fingerprint, user_id, first_seen_at, last_seen_at
      ) VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (user_fingerprint) DO NOTHING
    `;
    
    await this.db.query(query, [fingerprint, userId]);
  }

  /**
   * Calculate profile updates based on event
   */
  calculateProfileUpdates(event) {
    const updates = {
      total_events: 'total_events + 1',
      last_seen_at: 'NOW()'
    };

    switch (event.event_type) {
      case 'page_view':
        updates.total_page_views = 'total_page_views + 1';
        break;
      case 'booking_started':
        updates.booking_conversion_rate = `
          CASE 
            WHEN total_sessions > 0 
            THEN (total_bookings + 1)::NUMERIC / total_sessions::NUMERIC 
            ELSE 0 
          END
        `;
        break;
      case 'booking_completed':
        updates.total_bookings = 'total_bookings + 1';
        if (event.event_data?.booking_value) {
          updates.total_booking_value = `total_booking_value + ${parseFloat(event.event_data.booking_value)}`;
        }
        break;
      case 'price_check':
        updates.price_check_frequency = 'price_check_frequency + 1';
        break;
      case 'service_comparison':
        updates.service_comparison_count = 'service_comparison_count + 1';
        break;
    }

    return updates;
  }

  /**
   * Build update query for user profile
   */
  buildUpdateQuery(updates, fingerprint) {
    const setClauses = [];
    const values = [fingerprint];
    let paramIndex = 2;

    for (const [field, value] of Object.entries(updates)) {
      if (value === 'NOW()' || value.includes('+') || value.includes('CASE')) {
        setClauses.push(`${field} = ${value}`);
      } else {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    const query = `
      UPDATE user_behavior_profiles 
      SET ${setClauses.join(', ')}, last_updated_at = NOW()
      WHERE user_fingerprint = $1
    `;

    return { query, values };
  }

  /**
   * Get customer insights for a specific user
   * @param {string} fingerprint - User fingerprint
   * @returns {Promise<Object>} - Customer insights data
   */
  async getCustomerInsights(fingerprint) {
    try {
      // Get user profile from database
      const profileResult = await this.db.query(
        'SELECT * FROM user_behavior_profiles WHERE user_fingerprint = $1',
        [fingerprint]
      );

      if (profileResult.rows.length === 0) {
        return { error: 'User profile not found' };
      }

      const profile = profileResult.rows[0];

      // Get recent events
      const eventsResult = await this.db.query(`
        SELECT event_type, COUNT(*) as count, MAX(created_at) as last_occurrence
        FROM analytics_events 
        WHERE user_fingerprint = $1 AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `, [fingerprint]);

      // Get journey stages
      const journeyResult = await this.db.query(`
        SELECT journey_stage, COUNT(*) as visits, AVG(time_spent_seconds) as avg_time
        FROM customer_journeys
        WHERE user_fingerprint = $1
        GROUP BY journey_stage
        ORDER BY MAX(stage_entered_at) DESC
      `, [fingerprint]);

      // Get ML predictions
      const predictionsResult = await this.db.query(`
        SELECT model_type, prediction_value, confidence_score, created_at
        FROM ml_predictions
        WHERE user_fingerprint = $1 AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 5
      `, [fingerprint]);

      // Calculate additional insights
      const insights = {
        profile: {
          fingerprint: profile.user_fingerprint,
          customerId: profile.user_id,
          firstSeen: profile.first_seen_at,
          lastSeen: profile.last_seen_at,
          totalSessions: profile.total_sessions,
          totalBookings: profile.total_bookings,
          totalValue: profile.total_booking_value,
          segment: profile.customer_segment
        },
        scores: {
          engagement: profile.engagement_score,
          lead: profile.lead_score,
          churnRisk: profile.churn_risk_score,
          priceSensitivity: profile.price_sensitivity_score,
          conversionProbability: profile.conversion_probability
        },
        behavior: {
          avgSessionDuration: profile.avg_session_duration_seconds,
          pagesPerSession: profile.pages_per_session,
          bounceRate: profile.bounce_rate,
          preferredDevice: profile.primary_device_type,
          recentEvents: eventsResult.rows
        },
        journey: {
          stages: journeyResult.rows,
          currentStage: journeyResult.rows[0]?.journey_stage || 'unknown'
        },
        predictions: predictionsResult.rows
      };

      // Cache insights for quick retrieval
      await this.redis.setEx(
        `insights:${fingerprint}`,
        300, // 5 minutes
        JSON.stringify(insights)
      );

      return insights;
    } catch (error) {
      console.error('Error getting customer insights:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics metrics
   * @returns {Promise<Object>} - Real-time metrics data
   */
  async getRealtimeMetrics() {
    try {
      // Try to get from cache first
      const cached = await this.redis.get('realtime_metrics');
      if (cached) {
        return JSON.parse(cached);
      }

      // Query real-time metrics from database
      const metricsResult = await this.db.query(`
        SELECT 
          COUNT(DISTINCT user_fingerprint) as active_users,
          COUNT(DISTINCT session_id) as active_sessions,
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
          COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as conversions,
          AVG(CASE WHEN event_type = 'booking_completed' AND event_data->>'booking_value' IS NOT NULL 
              THEN (event_data->>'booking_value')::NUMERIC ELSE NULL END) as avg_booking_value
        FROM analytics_events 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `);

      // Get conversion funnel data
      const funnelResult = await this.db.query(`
        SELECT 
          funnel_name,
          step_name,
          COUNT(DISTINCT user_fingerprint) as users,
          COUNT(CASE WHEN completed_step THEN 1 END) as completed
        FROM conversion_funnels 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY funnel_name, step_name, step_number
        ORDER BY funnel_name, step_number
      `);

      // Get top pages
      const topPagesResult = await this.db.query(`
        SELECT 
          page_url,
          COUNT(*) as views,
          COUNT(DISTINCT user_fingerprint) as unique_visitors
        FROM analytics_events 
        WHERE event_type = 'page_view' AND created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY page_url
        ORDER BY views DESC
        LIMIT 10
      `);

      const metrics = {
        timestamp: new Date().toISOString(),
        overview: metricsResult.rows[0],
        funnel: funnelResult.rows,
        topPages: topPagesResult.rows,
        performance: {
          avgResponseTime: Math.random() * 200 + 100, // Placeholder - implement actual monitoring
          errorRate: Math.random() * 0.02, // Placeholder
          uptime: 99.9
        }
      };

      // Cache for 30 seconds
      await this.redis.setEx('realtime_metrics', 30, JSON.stringify(metrics));

      return metrics;
    } catch (error) {
      console.error('Error getting realtime metrics:', error);
      throw error;
    }
  }

  /**
   * Update real-time metrics in Redis
   */
  async updateRealtimeMetrics(event) {
    try {
      const hour = new Date().toISOString().slice(0, 13);
      const minute = new Date().toISOString().slice(0, 16);

      // Increment counters
      await this.redis.hincrby(`metrics:${hour}:events`, event.event_type, 1);
      await this.redis.sadd(`metrics:${hour}:users`, event.user_fingerprint);
      await this.redis.sadd(`metrics:${minute}:active_users`, event.user_fingerprint);

      // Set expiration
      await this.redis.expire(`metrics:${hour}:events`, 7200); // 2 hours
      await this.redis.expire(`metrics:${hour}:users`, 7200);
      await this.redis.expire(`metrics:${minute}:active_users`, 120); // 2 minutes
    } catch (error) {
      console.error('Error updating realtime metrics:', error);
    }
  }

  /**
   * Get conversion funnel data
   * @param {string} funnelName - Name of the funnel (optional)
   * @param {string} timeframe - Timeframe for analysis
   * @returns {Promise<Object>} - Funnel analysis data
   */
  async getConversionFunnel(funnelName = null, timeframe = '7 days') {
    try {
      let query = `
        SELECT 
          funnel_name,
          step_number,
          step_name,
          COUNT(DISTINCT user_fingerprint) as users_entered,
          COUNT(CASE WHEN completed_step THEN 1 END) as users_completed,
          COUNT(CASE WHEN dropped_off THEN 1 END) as users_dropped,
          AVG(time_in_step_seconds) as avg_time_in_step,
          ROUND(
            (COUNT(CASE WHEN completed_step THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(DISTINCT user_fingerprint)::NUMERIC, 0)) * 100, 2
          ) as completion_rate
        FROM conversion_funnels 
        WHERE created_at >= NOW() - INTERVAL '${timeframe}'
      `;

      const values = [];
      if (funnelName) {
        query += ' AND funnel_name = $1';
        values.push(funnelName);
      }

      query += ' GROUP BY funnel_name, step_number, step_name ORDER BY funnel_name, step_number';

      const result = await this.db.query(query, values);

      // Calculate drop-off rates between steps
      const funnels = {};
      result.rows.forEach(row => {
        if (!funnels[row.funnel_name]) {
          funnels[row.funnel_name] = {
            name: row.funnel_name,
            steps: [],
            totalUsers: 0,
            completedUsers: 0,
            overallConversionRate: 0
          };
        }

        funnels[row.funnel_name].steps.push({
          number: row.step_number,
          name: row.step_name,
          usersEntered: parseInt(row.users_entered),
          usersCompleted: parseInt(row.users_completed),
          usersDropped: parseInt(row.users_dropped),
          avgTimeInStep: parseFloat(row.avg_time_in_step) || 0,
          completionRate: parseFloat(row.completion_rate) || 0
        });

        if (row.step_number === 1) {
          funnels[row.funnel_name].totalUsers = parseInt(row.users_entered);
        }
      });

      // Calculate overall conversion rates and step-to-step drop-offs
      Object.values(funnels).forEach(funnel => {
        if (funnel.steps.length > 0) {
          const lastStep = funnel.steps[funnel.steps.length - 1];
          funnel.completedUsers = lastStep.usersCompleted;
          funnel.overallConversionRate = funnel.totalUsers > 0
            ? ((funnel.completedUsers / funnel.totalUsers) * 100).toFixed(2)
            : 0;

          // Calculate step-to-step drop-off
          for (let i = 1; i < funnel.steps.length; i++) {
            const prevStep = funnel.steps[i - 1];
            const currStep = funnel.steps[i];
            currStep.dropOffFromPrevious = prevStep.usersCompleted > 0
              ? (((prevStep.usersCompleted - currStep.usersEntered) / prevStep.usersCompleted) * 100).toFixed(2)
              : 0;
          }
        }
      });

      return {
        timeframe,
        funnels: Object.values(funnels),
        summary: {
          totalFunnels: Object.keys(funnels).length,
          avgConversionRate: Object.values(funnels).reduce((sum, f) => sum + parseFloat(f.overallConversionRate), 0) / Object.keys(funnels).length || 0
        }
      };
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Machine Learning Features
   */

  /**
   * Calculate engagement score for a user
   * @param {Object} profile - User behavior profile
   * @returns {number} - Engagement score (0-100)
   */
  calculateEngagementScore(profile) {
    const weights = {
      sessionDuration: 0.2,
      pageViews: 0.15,
      eventFrequency: 0.15,
      recency: 0.2,
      bookingActivity: 0.3
    };

    let score = 0;

    // Session duration score (normalized to 0-100)
    const avgDuration = profile.avg_session_duration_seconds || 0;
    const durationScore = Math.min(100, (avgDuration / 300) * 100); // 5 min = 100
    score += durationScore * weights.sessionDuration;

    // Page views score
    const pagesPerSession = profile.pages_per_session || 0;
    const pageScore = Math.min(100, (pagesPerSession / 10) * 100); // 10 pages = 100
    score += pageScore * weights.pageViews;

    // Event frequency score
    const eventsPerSession = profile.total_events / Math.max(1, profile.total_sessions);
    const eventScore = Math.min(100, (eventsPerSession / 20) * 100); // 20 events = 100
    score += eventScore * weights.eventFrequency;

    // Recency score
    const daysSinceLastVisit = profile.days_since_last_visit || 999;
    const recencyScore = Math.max(0, 100 - (daysSinceLastVisit * 10)); // -10 per day
    score += recencyScore * weights.recency;

    // Booking activity score
    const bookingScore = profile.total_bookings > 0 ? 100 : 
                        profile.booking_conversion_rate > 0 ? 50 : 0;
    score += bookingScore * weights.bookingActivity;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate lead score for a user
   * @param {Object} profile - User behavior profile
   * @param {Array} events - Recent user events
   * @returns {number} - Lead score (0-100)
   */
  calculateLeadScore(profile, events = []) {
    let score = 0;

    // Base score from engagement
    score += this.calculateEngagementScore(profile) * 0.3;

    // High-value behaviors
    const valueBehaviors = {
      'pricing_viewed': 15,
      'booking_started': 25,
      'service_comparison': 10,
      'contact_viewed': 20,
      'price_calculator_used': 15
    };

    // Count valuable events
    events.forEach(event => {
      if (valueBehaviors[event.event_type]) {
        score += valueBehaviors[event.event_type];
      }
    });

    // Profile completeness bonus
    if (profile.user_id) score += 10;

    // Price sensitivity adjustment
    const priceSensitivity = profile.price_sensitivity_score || 50;
    if (priceSensitivity < 30) score += 10; // Less price sensitive = better lead

    // Cap at 100
    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate churn risk for a user
   * @param {Object} profile - User behavior profile
   * @returns {number} - Churn risk score (0-100, higher = more likely to churn)
   */
  calculateChurnRisk(profile) {
    let riskScore = 0;

    // Days since last visit (major factor)
    const daysSinceLastVisit = profile.days_since_last_visit || 0;
    if (daysSinceLastVisit > 30) riskScore += 40;
    else if (daysSinceLastVisit > 14) riskScore += 25;
    else if (daysSinceLastVisit > 7) riskScore += 10;

    // Declining engagement
    const engagementScore = profile.engagement_score || 0;
    if (engagementScore < 20) riskScore += 30;
    else if (engagementScore < 40) riskScore += 15;

    // No bookings despite multiple sessions
    if (profile.total_sessions > 5 && profile.total_bookings === 0) {
      riskScore += 20;
    }

    // Low session duration
    if (profile.avg_session_duration_seconds < 60) {
      riskScore += 10;
    }

    return Math.min(100, Math.round(riskScore));
  }

  /**
   * Update ML scores for a user
   * @param {string} fingerprint - User fingerprint
   */
  async updateMLScores(fingerprint) {
    try {
      // Get user profile
      const profileResult = await this.db.query(
        'SELECT * FROM user_behavior_profiles WHERE user_fingerprint = $1',
        [fingerprint]
      );

      if (profileResult.rows.length === 0) return;

      const profile = profileResult.rows[0];

      // Get recent events for scoring
      const eventsResult = await this.db.query(
        'SELECT * FROM analytics_events WHERE user_fingerprint = $1 ORDER BY created_at DESC LIMIT 50',
        [fingerprint]
      );

      const events = eventsResult.rows;

      // Calculate scores
      const engagementScore = this.calculateEngagementScore(profile);
      const leadScore = this.calculateLeadScore(profile, events);
      const churnRisk = this.calculateChurnRisk(profile);

      // Update profile with new scores
      await this.db.query(`
        UPDATE user_behavior_profiles
        SET 
          engagement_score = $2,
          lead_score = $3,
          churn_risk_score = $4,
          last_updated_at = NOW()
        WHERE user_fingerprint = $1
      `, [fingerprint, engagementScore, leadScore, churnRisk]);

      // Store ML predictions for tracking
      await this.storePrediction(fingerprint, 'engagement_scoring', engagementScore, 0.85);
      await this.storePrediction(fingerprint, 'lead_scoring', leadScore, 0.78);
      await this.storePrediction(fingerprint, 'churn_prediction', churnRisk, 0.72);

    } catch (error) {
      console.error('Error updating ML scores:', error);
    }
  }

  /**
   * Store ML prediction
   */
  async storePrediction(fingerprint, modelType, value, confidence) {
    const query = `
      INSERT INTO ml_predictions (
        user_fingerprint, model_type, model_version, prediction_value,
        confidence_score, features_used, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
      fingerprint,
      modelType,
      'v1.0',
      value,
      confidence,
      JSON.stringify({ source: 'analytics_service' }),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    ];

    await this.db.query(query, values);
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.flushEventQueue();
    await this.redis.quit();
    await this.db.end();
  }
}

module.exports = AnalyticsService;