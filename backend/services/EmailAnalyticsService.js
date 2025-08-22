const EventEmitter = require('events');

class EmailAnalyticsService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableRealTimeTracking: true,
      enableGeoTracking: true,
      enableDeviceTracking: true,
      enableConversionTracking: true,
      aggregationInterval: 3600000, // 1 hour
      retentionDays: 365,
      enableABTestAnalysis: true,
      enableRevenueAttribution: true,
      ...options
    };

    this.eventCache = new Map();
    this.dailyAggregates = new Map();
    this.conversionEvents = new Map();
    this.abTestResults = new Map();
    
    // Real-time metrics
    this.realtimeMetrics = {
      emailsSentToday: 0,
      emailsOpenedToday: 0,
      emailsClickedToday: 0,
      bounceRateToday: 0,
      currentOpenRate: 0,
      currentClickRate: 0
    };

    this.isProcessingEvents = false;
    this.setupEventProcessing();
  }

  async initialize() {
    try {
      
      // Load recent aggregates
      await this.loadRecentAggregates();
      
      // Start event processing
      this.startEventProcessor();
      
      // Setup periodic aggregation
      this.setupPeriodicAggregation();
      
      return true;
    } catch (error) {
      console.error('❌ Email Analytics Service initialization failed:', error);
      throw error;
    }
  }

  setupEventProcessing() {
    // Define event handlers
    this.eventHandlers = {
      'email_sent': this.handleEmailSent.bind(this),
      'email_delivered': this.handleEmailDelivered.bind(this),
      'email_opened': this.handleEmailOpened.bind(this),
      'email_clicked': this.handleEmailClicked.bind(this),
      'email_bounced': this.handleEmailBounced.bind(this),
      'email_spam': this.handleEmailSpam.bind(this),
      'email_unsubscribed': this.handleEmailUnsubscribed.bind(this),
      'conversion': this.handleConversion.bind(this)
    };
  }

  async trackEvent(eventType, eventData) {
    try {
      const enrichedEvent = await this.enrichEvent(eventType, eventData);
      
      // Store in cache for real-time processing
      const eventId = `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.eventCache.set(eventId, enrichedEvent);
      
      // Process event immediately for real-time metrics
      await this.processEventImmediate(eventType, enrichedEvent);
      
      // Store in database for persistence
      await this.storeEventInDatabase(eventType, enrichedEvent);
      
      // Emit event for other services
      this.emit('eventTracked', {
        eventType,
        eventId,
        timestamp: enrichedEvent.timestamp
      });

      return {
        success: true,
        eventId,
        timestamp: enrichedEvent.timestamp
      };
    } catch (error) {
      console.error('❌ Event tracking failed:', error);
      throw error;
    }
  }

  async enrichEvent(eventType, eventData) {
    const enriched = {
      ...eventData,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };

    // Add geo location if enabled and IP available
    if (this.options.enableGeoTracking && eventData.ip_address) {
      enriched.location = await this.getGeoLocation(eventData.ip_address);
    }

    // Add device/browser info if enabled and user agent available
    if (this.options.enableDeviceTracking && eventData.user_agent) {
      enriched.device_info = this.parseUserAgent(eventData.user_agent);
    }

    // Add campaign context
    if (eventData.email_send_id) {
      enriched.campaign_context = await this.getCampaignContext(eventData.email_send_id);
    }

    return enriched;
  }

  async getGeoLocation(ipAddress) {
    // Mock geo location - replace with actual service
    const mockLocations = [
      { country: 'UK', city: 'London', region: 'England' },
      { country: 'US', city: 'New York', region: 'NY' },
      { country: 'Canada', city: 'Toronto', region: 'ON' }
    ];
    
    return mockLocations[Math.floor(Math.random() * mockLocations.length)];
  }

  parseUserAgent(userAgent) {
    // Simple user agent parsing - use a proper library in production
    const device = {
      type: 'desktop',
      platform: 'unknown',
      browser: 'unknown'
    };

    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      device.type = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }

    if (/Windows/.test(userAgent)) device.platform = 'Windows';
    else if (/Mac/.test(userAgent)) device.platform = 'Mac';
    else if (/Linux/.test(userAgent)) device.platform = 'Linux';
    else if (/Android/.test(userAgent)) device.platform = 'Android';
    else if (/iPhone|iPad/.test(userAgent)) device.platform = 'iOS';

    if (/Chrome/.test(userAgent)) device.browser = 'Chrome';
    else if (/Safari/.test(userAgent)) device.browser = 'Safari';
    else if (/Firefox/.test(userAgent)) device.browser = 'Firefox';
    else if (/Edge/.test(userAgent)) device.browser = 'Edge';

    return device;
  }

  async getCampaignContext(emailSendId) {
    // Mock implementation - replace with database query
    return {
      campaign_id: 'campaign_123',
      template_id: 'template_456',
      workflow_id: 'workflow_789'
    };
  }

  async processEventImmediate(eventType, eventData) {
    // Update real-time metrics
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.dailyAggregates.has(today)) {
      this.dailyAggregates.set(today, {
        date: today,
        emails_sent: 0,
        emails_delivered: 0,
        unique_opens: new Set(),
        total_opens: 0,
        unique_clicks: new Set(),
        total_clicks: 0,
        bounces: 0,
        spam_complaints: 0,
        unsubscribes: 0,
        conversions: 0,
        revenue: 0
      });
    }

    const dailyData = this.dailyAggregates.get(today);
    const handler = this.eventHandlers[eventType];
    
    if (handler) {
      await handler(eventData, dailyData);
      this.updateRealtimeMetrics(dailyData);
    }
  }

  async handleEmailSent(eventData, dailyData) {
    dailyData.emails_sent++;
    console.log(`📧 Email sent tracked: ${eventData.email_send_id}`);
  }

  async handleEmailDelivered(eventData, dailyData) {
    dailyData.emails_delivered++;
    console.log(`📬 Email delivered tracked: ${eventData.email_send_id}`);
  }

  async handleEmailOpened(eventData, dailyData) {
    dailyData.unique_opens.add(eventData.email_send_id);
    dailyData.total_opens++;
    
    // Track A/B test if applicable
    if (eventData.campaign_context?.ab_test_id) {
      await this.trackABTestEvent(eventData.campaign_context.ab_test_id, 'open', eventData);
    }
    
    console.log(`👀 Email open tracked: ${eventData.email_send_id}`);
  }

  async handleEmailClicked(eventData, dailyData) {
    dailyData.unique_clicks.add(eventData.email_send_id);
    dailyData.total_clicks++;
    
    // Track click details
    await this.trackClickDetails(eventData);
    
    // Track A/B test if applicable
    if (eventData.campaign_context?.ab_test_id) {
      await this.trackABTestEvent(eventData.campaign_context.ab_test_id, 'click', eventData);
    }
    
  }

  async handleEmailBounced(eventData, dailyData) {
    dailyData.bounces++;
  }

  async handleEmailSpam(eventData, dailyData) {
    dailyData.spam_complaints++;
    console.log(`🚨 Spam complaint tracked: ${eventData.email_send_id}`);
  }

  async handleEmailUnsubscribed(eventData, dailyData) {
    dailyData.unsubscribes++;
    console.log(`👋 Unsubscribe tracked: ${eventData.email_send_id}`);
  }

  async handleConversion(eventData, dailyData) {
    dailyData.conversions++;
    if (eventData.revenue) {
      dailyData.revenue += eventData.revenue;
    }
    
    // Track conversion attribution
    await this.trackConversionAttribution(eventData);
    
    console.log(`💰 Conversion tracked: ${eventData.email_send_id} - $${eventData.revenue || 0}`);
  }

  async trackClickDetails(eventData) {
    // Store detailed click information
    const clickData = {
      email_send_id: eventData.email_send_id,
      clicked_url: eventData.clicked_url,
      link_name: eventData.link_name,
      timestamp: eventData.timestamp,
      location: eventData.location,
      device_info: eventData.device_info
    };
    
    // This would be stored in database
    console.log('🔗 Click details stored:', clickData);
  }

  async trackConversionAttribution(eventData) {
    // Track which email led to conversion
    const attribution = {
      conversion_id: eventData.conversion_id,
      email_send_id: eventData.email_send_id,
      campaign_id: eventData.campaign_context?.campaign_id,
      template_id: eventData.campaign_context?.template_id,
      revenue: eventData.revenue || 0,
      timestamp: eventData.timestamp,
      attribution_model: 'last_click' // or first_click, linear, etc.
    };
    
    this.conversionEvents.set(eventData.conversion_id, attribution);
    console.log('💡 Conversion attribution tracked:', attribution);
  }

  async trackABTestEvent(abTestId, eventType, eventData) {
    if (!this.abTestResults.has(abTestId)) {
      this.abTestResults.set(abTestId, {
        test_id: abTestId,
        variant_a: { sent: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0 },
        variant_b: { sent: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0 }
      });
    }

    const testData = this.abTestResults.get(abTestId);
    const variant = eventData.ab_variant || 'a';
    const variantData = variant === 'a' ? testData.variant_a : testData.variant_b;

    switch (eventType) {
      case 'open':
        variantData.opens++;
        break;
      case 'click':
        variantData.clicks++;
        break;
      case 'conversion':
        variantData.conversions++;
        if (eventData.revenue) {
          variantData.revenue += eventData.revenue;
        }
        break;
    }

  }

  updateRealtimeMetrics(dailyData) {
    this.realtimeMetrics.emailsSentToday = dailyData.emails_sent;
    this.realtimeMetrics.emailsOpenedToday = dailyData.unique_opens.size;
    this.realtimeMetrics.emailsClickedToday = dailyData.unique_clicks.size;
    
    // Calculate rates
    if (dailyData.emails_sent > 0) {
      this.realtimeMetrics.currentOpenRate = dailyData.unique_opens.size / dailyData.emails_sent;
      this.realtimeMetrics.currentClickRate = dailyData.unique_clicks.size / dailyData.emails_sent;
      this.realtimeMetrics.bounceRateToday = dailyData.bounces / dailyData.emails_sent;
    }
  }

  async storeEventInDatabase(eventType, eventData) {
    // Mock database storage - replace with actual implementation
  }

  async loadRecentAggregates() {
    // Load recent daily aggregates from database
    
    // Mock implementation - replace with database query
    const today = new Date().toISOString().split('T')[0];
    this.dailyAggregates.set(today, {
      date: today,
      emails_sent: 0,
      emails_delivered: 0,
      unique_opens: new Set(),
      total_opens: 0,
      unique_clicks: new Set(),
      total_clicks: 0,
      bounces: 0,
      spam_complaints: 0,
      unsubscribes: 0,
      conversions: 0,
      revenue: 0
    });
  }

  startEventProcessor() {
    if (this.isProcessingEvents) return;
    
    this.isProcessingEvents = true;
    
    // Process cached events periodically
    setInterval(() => {
      this.processCachedEvents();
    }, 30000); // Every 30 seconds

  }

  async processCachedEvents() {
    // Process any cached events that need batch processing
    if (this.eventCache.size === 0) return;

    const batchSize = 100;
    const events = Array.from(this.eventCache.entries()).slice(0, batchSize);

    for (const [eventId, eventData] of events) {
      try {
        // Additional processing for batched events
        await this.processBatchedEvent(eventData);
        this.eventCache.delete(eventId);
      } catch (error) {
        console.error(`❌ Batch event processing failed for ${eventId}:`, error);
      }
    }
  }

  async processBatchedEvent(eventData) {
    // Additional processing that can be done in batches
    // This could include ML analysis, advanced segmentation, etc.
  }

  setupPeriodicAggregation() {
    // Run daily aggregation
    setInterval(async () => {
      await this.performDailyAggregation();
    }, this.options.aggregationInterval);

    console.log('📈 Periodic aggregation scheduled');
  }

  async performDailyAggregation() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0];

    if (!this.dailyAggregates.has(dateKey)) return;

    const dailyData = this.dailyAggregates.get(dateKey);
    
    // Calculate final metrics
    const aggregatedData = {
      date: dateKey,
      emails_sent: dailyData.emails_sent,
      emails_delivered: dailyData.emails_delivered,
      unique_opens: dailyData.unique_opens.size,
      total_opens: dailyData.total_opens,
      unique_clicks: dailyData.unique_clicks.size,
      total_clicks: dailyData.total_clicks,
      bounces: dailyData.bounces,
      spam_complaints: dailyData.spam_complaints,
      unsubscribes: dailyData.unsubscribes,
      conversions: dailyData.conversions,
      revenue: dailyData.revenue,
      
      // Calculate rates
      open_rate: dailyData.emails_sent > 0 ? dailyData.unique_opens.size / dailyData.emails_sent : 0,
      click_rate: dailyData.emails_sent > 0 ? dailyData.unique_clicks.size / dailyData.emails_sent : 0,
      click_to_open_rate: dailyData.unique_opens.size > 0 ? dailyData.unique_clicks.size / dailyData.unique_opens.size : 0,
      bounce_rate: dailyData.emails_sent > 0 ? dailyData.bounces / dailyData.emails_sent : 0,
      spam_rate: dailyData.emails_sent > 0 ? dailyData.spam_complaints / dailyData.emails_sent : 0,
      unsubscribe_rate: dailyData.emails_sent > 0 ? dailyData.unsubscribes / dailyData.emails_sent : 0
    };

    // Store aggregated data
    await this.storeDailyAggregate(aggregatedData);
    
  }

  async storeDailyAggregate(aggregatedData) {
    // Store in database - mock implementation
  }

  // Public API methods
  async getEmailMetrics(timeRange = '7d', filters = {}) {
    const metrics = await this.calculateMetrics(timeRange, filters);
    return metrics;
  }

  async calculateMetrics(timeRange, filters) {
    // Mock implementation - replace with database queries
    const mockMetrics = {
      timeRange,
      totalSent: 1250,
      totalDelivered: 1198,
      uniqueOpens: 456,
      totalOpens: 623,
      uniqueClicks: 89,
      totalClicks: 134,
      bounces: 52,
      spamComplaints: 3,
      unsubscribes: 8,
      conversions: 12,
      revenue: 2450.00,
      
      // Rates
      deliveryRate: 0.9584,
      openRate: 0.3808,
      clickRate: 0.0743,
      clickToOpenRate: 0.1952,
      bounceRate: 0.0416,
      spamRate: 0.0024,
      unsubscribeRate: 0.0064,
      conversionRate: 0.0096,
      
      // Performance over time
      dailyBreakdown: this.generateDailyBreakdown(timeRange),
      
      // Top performing templates
      topTemplates: this.getTopPerformingTemplates(),
      
      // Device/Platform breakdown
      deviceBreakdown: this.getDeviceBreakdown(),
      
      // Geographic breakdown
      geoBreakdown: this.getGeoBreakdown()
    };

    return mockMetrics;
  }

  generateDailyBreakdown(timeRange) {
    const days = parseInt(timeRange) || 7;
    const breakdown = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      breakdown.push({
        date: date.toISOString().split('T')[0],
        sent: Math.floor(Math.random() * 200) + 50,
        opens: Math.floor(Math.random() * 80) + 20,
        clicks: Math.floor(Math.random() * 25) + 5,
        bounces: Math.floor(Math.random() * 10),
        conversions: Math.floor(Math.random() * 3)
      });
    }
    
    return breakdown;
  }

  getTopPerformingTemplates() {
    return [
      { templateId: 'welcome_series_1', name: 'Welcome Email', openRate: 0.65, clickRate: 0.12, conversions: 45 },
      { templateId: 'repair_complete', name: 'Repair Completed', openRate: 0.78, clickRate: 0.34, conversions: 23 },
      { templateId: 'booking_reminder', name: 'Booking Reminder', openRate: 0.82, clickRate: 0.28, conversions: 18 },
      { templateId: 'feedback_request', name: 'Feedback Request', openRate: 0.58, clickRate: 0.15, conversions: 8 }
    ];
  }

  getDeviceBreakdown() {
    return {
      desktop: { percentage: 45, opens: 234, clicks: 67 },
      mobile: { percentage: 42, opens: 198, clicks: 45 },
      tablet: { percentage: 13, opens: 67, clicks: 22 }
    };
  }

  getGeoBreakdown() {
    return [
      { country: 'UK', opens: 345, clicks: 89, conversions: 12 },
      { country: 'US', opens: 123, clicks: 34, conversions: 5 },
      { country: 'Canada', opens: 67, clicks: 18, conversions: 3 },
      { country: 'Australia', opens: 45, clicks: 12, conversions: 2 }
    ];
  }

  async getCampaignAnalytics(campaignId) {
    // Get detailed analytics for specific campaign
    return {
      campaignId,
      totalSent: 500,
      performance: {
        openRate: 0.45,
        clickRate: 0.08,
        conversionRate: 0.012,
        revenue: 890.00
      },
      timeline: this.generateCampaignTimeline(),
      topLinks: this.getTopClickedLinks(),
      audienceEngagement: this.getAudienceEngagement()
    };
  }

  generateCampaignTimeline() {
    return [
      { time: '2025-07-17 09:00', event: 'Campaign Started', count: 0 },
      { time: '2025-07-17 09:30', event: 'First Opens', count: 45 },
      { time: '2025-07-17 10:00', event: 'Peak Opens', count: 123 },
      { time: '2025-07-17 11:00', event: 'First Clicks', count: 12 },
      { time: '2025-07-17 14:00', event: 'Peak Clicks', count: 34 }
    ];
  }

  getTopClickedLinks() {
    return [
      { url: 'https://revivatech.co.uk/book-repair', clicks: 45, name: 'Book Repair CTA' },
      { url: 'https://revivatech.co.uk/services', clicks: 23, name: 'View Services' },
      { url: 'https://revivatech.co.uk/contact', clicks: 12, name: 'Contact Us' }
    ];
  }

  getAudienceEngagement() {
    return {
      highly_engaged: { count: 89, percentage: 17.8 },
      moderately_engaged: { count: 234, percentage: 46.8 },
      low_engaged: { count: 177, percentage: 35.4 }
    };
  }

  async getABTestResults(testId) {
    const testData = this.abTestResults.get(testId);
    if (!testData) {
      return null;
    }

    // Calculate statistical significance
    const significance = this.calculateStatisticalSignificance(testData);
    
    return {
      testId,
      ...testData,
      analysis: significance,
      recommendation: this.getABTestRecommendation(testData, significance)
    };
  }

  calculateStatisticalSignificance(testData) {
    const { variant_a, variant_b } = testData;
    
    // Simple statistical calculation - use proper statistical library in production
    const aRate = variant_a.sent > 0 ? variant_a.clicks / variant_a.sent : 0;
    const bRate = variant_b.sent > 0 ? variant_b.clicks / variant_b.sent : 0;
    
    const improvement = ((bRate - aRate) / aRate) * 100;
    const isSignificant = Math.abs(improvement) > 10; // Simplified significance test
    
    return {
      variantARate: aRate,
      variantBRate: bRate,
      improvement: improvement,
      isStatisticallySignificant: isSignificant,
      confidenceLevel: isSignificant ? 0.95 : 0.80,
      winner: bRate > aRate ? 'B' : 'A'
    };
  }

  getABTestRecommendation(testData, significance) {
    if (!significance.isStatisticallySignificant) {
      return 'Continue testing - results not yet statistically significant';
    }
    
    if (Math.abs(significance.improvement) > 20) {
      return `Strong winner: Variant ${significance.winner} shows ${Math.abs(significance.improvement).toFixed(1)}% improvement`;
    }
    
    return `Moderate winner: Variant ${significance.winner} shows ${Math.abs(significance.improvement).toFixed(1)}% improvement`;
  }

  // Real-time dashboard data
  getRealtimeMetrics() {
    return {
      ...this.realtimeMetrics,
      timestamp: Date.now(),
      activeTests: this.abTestResults.size,
      eventsInCache: this.eventCache.size
    };
  }

  // Revenue attribution analysis
  async getRevenueAttribution(timeRange = '30d') {
    const attributions = Array.from(this.conversionEvents.values());
    
    const totalRevenue = attributions.reduce((sum, attr) => sum + attr.revenue, 0);
    const campaignBreakdown = this.groupBy(attributions, 'campaign_id');
    const templateBreakdown = this.groupBy(attributions, 'template_id');
    
    return {
      timeRange,
      totalAttributedRevenue: totalRevenue,
      totalConversions: attributions.length,
      averageOrderValue: totalRevenue / attributions.length || 0,
      campaignPerformance: this.calculateRevenueByGroup(campaignBreakdown),
      templatePerformance: this.calculateRevenueByGroup(templateBreakdown),
      attributionModel: 'last_click'
    };
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  calculateRevenueByGroup(groups) {
    const results = [];
    
    for (const [groupKey, items] of Object.entries(groups)) {
      const revenue = items.reduce((sum, item) => sum + item.revenue, 0);
      const conversions = items.length;
      
      results.push({
        id: groupKey,
        revenue,
        conversions,
        averageOrderValue: revenue / conversions
      });
    }
    
    return results.sort((a, b) => b.revenue - a.revenue);
  }

  // Export and reporting
  async exportAnalytics(format = 'json', timeRange = '30d', filters = {}) {
    const data = await this.getEmailMetrics(timeRange, filters);
    
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  convertToCSV(data) {
    // Simple CSV conversion - use proper CSV library in production
    const headers = Object.keys(data);
    const values = Object.values(data);
    
    return `${headers.join(',')}\n${values.join(',')}`;
  }

  getMetrics() {
    return {
      eventsTracked: this.eventCache.size,
      dailyAggregates: this.dailyAggregates.size,
      abTestsActive: this.abTestResults.size,
      conversionsTracked: this.conversionEvents.size,
      isProcessingEvents: this.isProcessingEvents,
      realtimeMetrics: this.realtimeMetrics
    };
  }
}

module.exports = EmailAnalyticsService;