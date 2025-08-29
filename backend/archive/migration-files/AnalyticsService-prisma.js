const { prisma } = require('../lib/prisma');
const Redis = require('redis');
const crypto = require('crypto');

/**
 * PRISMA MIGRATION: AnalyticsService
 * Converted from raw SQL to Prisma ORM operations
 * Core service for processing analytics events, user behavior tracking, and ML features
 * Implements real-time event processing, customer insights, and predictive analytics
 */
class AnalyticsService {
  constructor() {
    // Initialize Redis connection for caching
    const redisConfig = {
      url: process.env.REDIS_URL || process.env.REDIS_INTERNAL_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
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
   * Process incoming analytics event using Prisma
   * @param {Object} eventData - Event data including fingerprint, session, type, etc.
   * @returns {Promise<Object>} - Processed event result
   */
  async processEvent(eventData) {
    try {
      // Validate event data
      if (!eventData.user_fingerprint || !eventData.session_id || !eventData.event_type) {
        throw new Error('Missing required event fields');
      }

      // Generate unique event ID
      const eventId = crypto.randomUUID();
      
      // Prepare event for database insertion
      const processedEvent = {
        id: eventId,
        user_fingerprint: eventData.user_fingerprint,
        session_id: eventData.session_id,
        event_type: eventData.event_type,
        event_data: eventData.event_data || {},
        page_url: eventData.page_url || null,
        page_title: eventData.page_title || null,
        referrer: eventData.referrer || null,
        user_agent: eventData.user_agent || null,
        ip_address: eventData.ip_address || null,
        timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
        processed: false,
        user_id: eventData.user_id || null,
        customer_id: eventData.customer_id || null,
        engagement_score: this.calculateEngagementScore(eventData),
        conversion_value: eventData.conversion_value || null,
        utm_source: eventData.utm_source || null,
        utm_medium: eventData.utm_medium || null,
        utm_campaign: eventData.utm_campaign || null,
        device_type: this.detectDeviceType(eventData.user_agent),
        browser_name: this.extractBrowser(eventData.user_agent),
        os_name: this.extractOS(eventData.user_agent)
      };

      // Add event to processing queue for batch insertion
      this.eventQueue.push(processedEvent);

      // Real-time processing for critical events
      if (this.isCriticalEvent(eventData.event_type)) {
        await this.processCriticalEvent(processedEvent);
      }

      // Update session data using Prisma
      await this.updateSessionData(eventData.session_id, eventData);

      // Cache frequently accessed data
      await this.cacheEventData(eventId, processedEvent);

      return {
        success: true,
        event_id: eventId,
        processed_at: new Date().toISOString(),
        queue_size: this.eventQueue.length
      };

    } catch (error) {
      console.error('Event processing error:', error);
      throw new Error(`Failed to process analytics event: ${error.message}`);
    }
  }

  /**
   * Start batch processing of queued events using Prisma
   */
  startBatchProcessing() {
    setInterval(async () => {
      if (this.eventQueue.length === 0) return;

      try {
        // Get batch of events to process
        const batch = this.eventQueue.splice(0, this.batchSize);
        
        // Insert batch of events using Prisma
        const insertedEvents = await prisma.analyticsEvent.createMany({
          data: batch,
          skipDuplicates: true
        });

        console.log(`📊 Processed ${insertedEvents.count} analytics events`);

        // Process aggregations for the batch
        await this.processAggregations(batch);

      } catch (error) {
        console.error('Batch processing error:', error);
        // Re-add failed events to queue for retry
        this.eventQueue.unshift(...batch);
      }
    }, this.flushInterval);
  }

  /**
   * Update session data using Prisma
   */
  async updateSessionData(sessionId, eventData) {
    try {
      const sessionUpdate = {
        last_activity: new Date(),
        page_views: { increment: 1 },
        updated_at: new Date()
      };

      // Update additional session metrics based on event type
      if (eventData.event_type === 'page_view') {
        sessionUpdate.total_pages_viewed = { increment: 1 };
      } else if (eventData.event_type === 'click') {
        sessionUpdate.total_clicks = { increment: 1 };
      } else if (eventData.event_type === 'conversion') {
        sessionUpdate.conversions = { increment: 1 };
        if (eventData.conversion_value) {
          sessionUpdate.total_conversion_value = { 
            increment: parseFloat(eventData.conversion_value) 
          };
        }
      }

      // Check if session exists, create if not
      await prisma.analyticsSession.upsert({
        where: { id: sessionId },
        update: sessionUpdate,
        create: {
          id: sessionId,
          user_fingerprint: eventData.user_fingerprint,
          started_at: new Date(),
          last_activity: new Date(),
          page_views: 1,
          total_pages_viewed: 1,
          total_clicks: 0,
          conversions: 0,
          total_conversion_value: 0,
          user_agent: eventData.user_agent,
          ip_address: eventData.ip_address,
          referrer: eventData.referrer,
          utm_source: eventData.utm_source,
          utm_medium: eventData.utm_medium,
          utm_campaign: eventData.utm_campaign,
          device_type: this.detectDeviceType(eventData.user_agent),
          browser_name: this.extractBrowser(eventData.user_agent),
          os_name: this.extractOS(eventData.user_agent),
          created_at: new Date(),
          updated_at: new Date()
        }
      });

    } catch (error) {
      console.error('Session update error:', error);
    }
  }

  /**
   * Process aggregations for analytics data using Prisma
   */
  async processAggregations(events) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      for (const event of events) {
        // Daily aggregation
        await prisma.analyticsAggregation.upsert({
          where: {
            date_event_type: {
              date: today,
              event_type: event.event_type
            }
          },
          update: {
            count: { increment: 1 },
            total_engagement_score: { increment: event.engagement_score || 0 },
            updated_at: now
          },
          create: {
            date: today,
            event_type: event.event_type,
            count: 1,
            total_engagement_score: event.engagement_score || 0,
            unique_users: 1,
            unique_sessions: 1,
            created_at: now,
            updated_at: now
          }
        });

        // Page-specific aggregation
        if (event.page_url) {
          await prisma.analyticsAggregation.upsert({
            where: {
              date_page_url: {
                date: today,
                page_url: event.page_url
              }
            },
            update: {
              count: { increment: 1 },
              updated_at: now
            },
            create: {
              date: today,
              page_url: event.page_url,
              count: 1,
              unique_users: 1,
              unique_sessions: 1,
              created_at: now,
              updated_at: now
            }
          });
        }
      }

    } catch (error) {
      console.error('Aggregation processing error:', error);
    }
  }

  /**
   * Get user behavior profile using Prisma
   */
  async getUserBehaviorProfile(userFingerprint, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [events, sessions, aggregations] = await Promise.all([
        // Get user events
        prisma.analyticsEvent.findMany({
          where: {
            user_fingerprint: userFingerprint,
            timestamp: { gte: startDate }
          },
          orderBy: { timestamp: 'desc' }
        }),

        // Get user sessions
        prisma.analyticsSession.findMany({
          where: {
            user_fingerprint: userFingerprint,
            started_at: { gte: startDate }
          },
          orderBy: { started_at: 'desc' }
        }),

        // Get aggregated data
        prisma.analyticsEvent.groupBy({
          by: ['event_type'],
          where: {
            user_fingerprint: userFingerprint,
            timestamp: { gte: startDate }
          },
          _count: { id: true },
          _avg: { engagement_score: true }
        })
      ]);

      // Calculate behavior metrics
      const totalEvents = events.length;
      const totalSessions = sessions.length;
      const avgSessionDuration = sessions.reduce((sum, session) => {
        if (session.last_activity && session.started_at) {
          return sum + (new Date(session.last_activity) - new Date(session.started_at));
        }
        return sum;
      }, 0) / sessions.length || 0;

      const avgEngagementScore = events.reduce((sum, event) => 
        sum + (event.engagement_score || 0), 0) / totalEvents || 0;

      // Categorize user behavior
      const behaviorCategory = this.categorizeBehavior({
        totalEvents,
        totalSessions,
        avgSessionDuration,
        avgEngagementScore
      });

      return {
        user_fingerprint: userFingerprint,
        period_days: days,
        total_events: totalEvents,
        total_sessions: totalSessions,
        avg_session_duration_ms: avgSessionDuration,
        avg_engagement_score: avgEngagementScore,
        behavior_category: behaviorCategory,
        event_types: aggregations.map(agg => ({
          type: agg.event_type,
          count: agg._count.id,
          avg_engagement: agg._avg.engagement_score || 0
        })),
        most_recent_activity: events[0]?.timestamp,
        favorite_pages: this.extractFavoritePages(events)
      };

    } catch (error) {
      console.error('User behavior profile error:', error);
      throw error;
    }
  }

  /**
   * Get customer journey data using Prisma
   */
  async getCustomerJourney(customerId, days = 90) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const journeyData = await prisma.analyticsEvent.findMany({
        where: {
          customer_id: customerId,
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          event_type: true,
          page_url: true,
          page_title: true,
          timestamp: true,
          event_data: true,
          engagement_score: true,
          conversion_value: true
        }
      });

      // Process journey stages
      const journeyStages = this.identifyJourneyStages(journeyData);
      const touchpoints = this.extractTouchpoints(journeyData);
      const conversionEvents = journeyData.filter(event => 
        event.conversion_value && event.conversion_value > 0);

      return {
        customer_id: customerId,
        period_days: days,
        total_touchpoints: journeyData.length,
        journey_stages: journeyStages,
        key_touchpoints: touchpoints,
        conversion_events: conversionEvents.length,
        total_conversion_value: conversionEvents.reduce((sum, event) => 
          sum + (parseFloat(event.conversion_value) || 0), 0),
        journey_timeline: journeyData,
        journey_insights: this.generateJourneyInsights(journeyData)
      };

    } catch (error) {
      console.error('Customer journey error:', error);
      throw error;
    }
  }

  /**
   * Get analytics dashboard data using Prisma
   */
  async getDashboardData(period = '7d') {
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalEvents,
        uniqueUsers,
        topPages,
        eventTypes,
        conversionMetrics,
        deviceStats,
        sessionStats
      ] = await Promise.all([
        // Total events
        prisma.analyticsEvent.count({
          where: { timestamp: { gte: startDate } }
        }),

        // Unique users
        prisma.analyticsEvent.findMany({
          where: { timestamp: { gte: startDate } },
          distinct: ['user_fingerprint'],
          select: { user_fingerprint: true }
        }),

        // Top pages
        prisma.analyticsEvent.groupBy({
          by: ['page_url'],
          where: {
            timestamp: { gte: startDate },
            page_url: { not: null }
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }),

        // Event types distribution
        prisma.analyticsEvent.groupBy({
          by: ['event_type'],
          where: { timestamp: { gte: startDate } },
          _count: { id: true },
          _avg: { engagement_score: true }
        }),

        // Conversion metrics
        prisma.analyticsEvent.aggregate({
          where: {
            timestamp: { gte: startDate },
            conversion_value: { gt: 0 }
          },
          _count: { id: true },
          _sum: { conversion_value: true },
          _avg: { conversion_value: true }
        }),

        // Device type stats
        prisma.analyticsSession.groupBy({
          by: ['device_type'],
          where: { started_at: { gte: startDate } },
          _count: { id: true }
        }),

        // Session statistics
        prisma.analyticsSession.aggregate({
          where: { started_at: { gte: startDate } },
          _count: { id: true },
          _avg: { page_views: true },
          _sum: { conversions: true }
        })
      ]);

      return {
        period: period,
        overview: {
          total_events: totalEvents,
          unique_users: uniqueUsers.length,
          total_sessions: sessionStats._count.id,
          avg_pages_per_session: sessionStats._avg.page_views || 0,
          total_conversions: sessionStats._sum.conversions || 0
        },
        top_pages: topPages.map(page => ({
          url: page.page_url,
          views: page._count.id
        })),
        event_distribution: eventTypes.map(type => ({
          type: type.event_type,
          count: type._count.id,
          avg_engagement: type._avg.engagement_score || 0
        })),
        conversions: {
          total_conversions: conversionMetrics._count.id,
          total_value: parseFloat(conversionMetrics._sum.conversion_value || 0),
          avg_value: parseFloat(conversionMetrics._avg.conversion_value || 0)
        },
        devices: deviceStats.map(device => ({
          type: device.device_type,
          sessions: device._count.id
        })),
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Dashboard data error:', error);
      throw error;
    }
  }

  // Helper methods (business logic - no SQL changes needed)
  
  calculateEngagementScore(eventData) {
    let score = 1;
    
    if (eventData.event_type === 'page_view') score = 1;
    else if (eventData.event_type === 'click') score = 2;
    else if (eventData.event_type === 'scroll') score = 1.5;
    else if (eventData.event_type === 'form_submit') score = 5;
    else if (eventData.event_type === 'conversion') score = 10;
    
    // Adjust for page type
    if (eventData.page_url?.includes('/booking')) score *= 2;
    if (eventData.page_url?.includes('/checkout')) score *= 3;
    
    return score;
  }

  isCriticalEvent(eventType) {
    return ['conversion', 'form_submit', 'error', 'checkout'].includes(eventType);
  }

  detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  extractBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  extractOS(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  }

  categorizeBehavior({ totalEvents, totalSessions, avgSessionDuration, avgEngagementScore }) {
    if (totalEvents > 100 && avgEngagementScore > 5) return 'highly_engaged';
    if (totalEvents > 50 && avgEngagementScore > 3) return 'engaged';
    if (totalEvents > 10 && avgEngagementScore > 1) return 'casual';
    return 'low_engagement';
  }

  extractFavoritePages(events) {
    const pageCount = {};
    events.forEach(event => {
      if (event.page_url) {
        pageCount[event.page_url] = (pageCount[event.page_url] || 0) + 1;
      }
    });
    
    return Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([url, count]) => ({ url, visits: count }));
  }

  identifyJourneyStages(journeyData) {
    const stages = {
      awareness: journeyData.filter(e => e.page_url?.includes('/') && !e.page_url?.includes('/booking')).length,
      consideration: journeyData.filter(e => e.page_url?.includes('/services') || e.page_url?.includes('/pricing')).length,
      decision: journeyData.filter(e => e.page_url?.includes('/booking') || e.event_type === 'form_submit').length,
      conversion: journeyData.filter(e => e.conversion_value > 0).length
    };
    
    return stages;
  }

  extractTouchpoints(journeyData) {
    return journeyData.filter((event, index) => {
      // Include first event, conversions, and significant page changes
      return index === 0 || 
             event.conversion_value > 0 || 
             event.event_type === 'form_submit' ||
             (index > 0 && event.page_url !== journeyData[index - 1].page_url);
    });
  }

  generateJourneyInsights(journeyData) {
    const insights = [];
    
    if (journeyData.length > 20) {
      insights.push('High engagement - multiple touchpoints');
    }
    
    const conversionEvents = journeyData.filter(e => e.conversion_value > 0);
    if (conversionEvents.length > 1) {
      insights.push('Repeat customer - multiple conversions');
    }
    
    const avgTimeSpent = journeyData.length > 1 
      ? (new Date(journeyData[journeyData.length - 1].timestamp) - new Date(journeyData[0].timestamp)) / journeyData.length
      : 0;
    
    if (avgTimeSpent > 300000) { // 5 minutes
      insights.push('Considered decision - extended evaluation period');
    }
    
    return insights;
  }

  async processCriticalEvent(event) {
    // Process critical events immediately
    try {
      await prisma.analyticsEvent.create({ data: event });
      
      // Trigger real-time alerts if needed
      if (event.event_type === 'error') {
        console.warn(`🚨 Critical error event: ${event.page_url}`);
      }
      
    } catch (error) {
      console.error('Critical event processing error:', error);
    }
  }

  async cacheEventData(eventId, eventData) {
    try {
      await this.redis.setEx(
        `event:${eventId}`, 
        3600, // 1 hour cache
        JSON.stringify(eventData)
      );
    } catch (error) {
      console.error('Event caching error:', error);
    }
  }

  /**
   * Close connections gracefully
   */
  async close() {
    try {
      await this.redis.quit();
      await prisma.$disconnect();
    } catch (error) {
      console.error('Service cleanup error:', error);
    }
  }
}

module.exports = new AnalyticsService();