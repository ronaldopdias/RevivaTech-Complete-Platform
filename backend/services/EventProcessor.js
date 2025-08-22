/**
 * EventProcessor.js - High-Performance Event Processing Service
 * Session 8: Performance & Monitoring Implementation
 * 
 * Features:
 * - Event processing under 500ms target
 * - Batch processing and queue management
 * - Real-time analytics pipeline
 * - Event deduplication and validation
 * - Failover and retry mechanisms
 * - Performance optimization
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class EventProcessor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Performance targets
      processingTimeTarget: 500,    // 500ms target
      batchSize: 100,               // Events per batch
      maxQueueSize: 10000,          // Maximum events in queue
      
      // Processing intervals
      batchInterval: 100,           // Process every 100ms
      cleanupInterval: 60000,       // Cleanup every minute
      metricsInterval: 30000,       // Metrics every 30 seconds
      
      // Retry configuration
      maxRetries: 3,
      retryDelay: 1000,            // 1 second base delay
      retryBackoff: 2,             // Exponential backoff multiplier
      
      // Deduplication
      deduplicationWindow: 5000,    // 5 seconds
      enableDeduplication: true,
      
      // Pipeline stages
      stages: [
        'validation',
        'enrichment', 
        'deduplication',
        'processing',
        'storage',
        'notification'
      ],
      
      // Event types configuration
      eventTypes: {
        'page_view': { priority: 'low', ttl: 3600 },
        'click_event': { priority: 'medium', ttl: 3600 },
        'form_interaction': { priority: 'medium', ttl: 7200 },
        'booking_start': { priority: 'high', ttl: 86400 },
        'booking_complete': { priority: 'critical', ttl: 86400 },
        'user_register': { priority: 'critical', ttl: 86400 },
        'payment_complete': { priority: 'critical', ttl: 86400 },
        'error_event': { priority: 'critical', ttl: 3600 }
      },
      
      ...config
    };

    // Processing queues by priority
    this.queues = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    // Processing state
    this.isProcessing = false;
    this.processingStats = {
      processed: 0,
      failed: 0,
      dropped: 0,
      retried: 0,
      avgProcessingTime: 0,
      totalProcessingTime: 0,
      batchesProcessed: 0,
      eventsPerSecond: 0,
      lastProcessedAt: null
    };

    // Deduplication cache
    this.deduplicationCache = new Map();
    
    // Failed events for retry
    this.failedEvents = [];
    this.retryQueue = [];

    // Performance monitoring
    this.performanceMetrics = {
      stageTimings: {},
      bottlenecks: [],
      slowEvents: [],
      errorPatterns: {}
    };

    // Services (injected)
    this.cacheService = null;
    this.databaseService = null;
    this.monitoringService = null;
    this.marketingAutomation = null;

    this.init();
  }

  async init() {
    try {
      
      // Start processing loop
      this.startProcessing();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Start cleanup routines
      this.startCleanup();
      
      console.log('EventProcessor initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize EventProcessor:', error);
      throw error;
    }
  }

  // Inject dependencies
  setServices({ cacheService, databaseService, monitoringService, marketingAutomation }) {
    this.cacheService = cacheService;
    this.databaseService = databaseService;
    this.monitoringService = monitoringService;
    this.marketingAutomation = marketingAutomation;
  }

  // Main entry point for event processing
  async processEvent(eventData, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate event data
      const validatedEvent = await this.validateEvent(eventData);
      
      // Check if we should process immediately or queue
      if (options.immediate || this.shouldProcessImmediately(validatedEvent)) {
        return await this.processEventImmediately(validatedEvent, startTime);
      } else {
        return this.queueEvent(validatedEvent, startTime);
      }
      
    } catch (error) {
      console.error('Event processing error:', error);
      this.processingStats.failed++;
      
      if (this.monitoringService) {
        this.monitoringService.recordError('event_processing', error);
      }
      
      throw error;
    }
  }

  async validateEvent(eventData) {
    const validationStart = Date.now();
    
    // Basic structure validation
    if (!eventData || typeof eventData !== 'object') {
      throw new Error('Invalid event data: must be an object');
    }

    // Required fields
    const requiredFields = ['eventType', 'timestamp', 'sessionId'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Event type validation
    if (!this.config.eventTypes[eventData.eventType]) {
      console.warn(`Unknown event type: ${eventData.eventType}`);
    }

    // Timestamp validation
    const eventTime = new Date(eventData.timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - eventTime.getTime());
    
    if (timeDiff > 300000) { // 5 minutes
      console.warn(`Event timestamp is too old/future: ${eventData.timestamp}`);
    }

    // Add validation metadata
    const validatedEvent = {
      ...eventData,
      validatedAt: Date.now(),
      processingId: this.generateProcessingId(),
      priority: this.getEventPriority(eventData.eventType),
      validationTime: Date.now() - validationStart
    };

    return validatedEvent;
  }

  generateProcessingId() {
    return crypto.randomBytes(8).toString('hex');
  }

  getEventPriority(eventType) {
    return this.config.eventTypes[eventType]?.priority || 'medium';
  }

  shouldProcessImmediately(event) {
    // Process critical events immediately
    if (event.priority === 'critical') return true;
    
    // Process if queues are small
    const totalQueueSize = this.getTotalQueueSize();
    if (totalQueueSize < 10) return true;
    
    return false;
  }

  async processEventImmediately(event, startTime) {
    try {
      const result = await this.executeProcessingPipeline(event);
      
      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime, true);
      
      // Check performance target
      if (processingTime > this.config.processingTimeTarget) {
        console.warn(`Event processing exceeded target: ${processingTime}ms > ${this.config.processingTimeTarget}ms`);
        this.recordSlowEvent(event, processingTime);
      }
      
      return {
        success: true,
        processingId: event.processingId,
        processingTime,
        result
      };
      
    } catch (error) {
      console.error(`Immediate processing failed for event ${event.processingId}:`, error);
      
      // Add to retry queue
      this.addToRetryQueue(event, error);
      
      throw error;
    }
  }

  queueEvent(event, startTime) {
    const priority = event.priority;
    
    // Check queue size limits
    if (this.getTotalQueueSize() >= this.config.maxQueueSize) {
      console.warn('Event queue is full, dropping event');
      this.processingStats.dropped++;
      return {
        success: false,
        reason: 'queue_full',
        processingId: event.processingId
      };
    }
    
    // Add to appropriate priority queue
    this.queues[priority].push({
      ...event,
      queuedAt: Date.now(),
      queueTime: Date.now() - startTime
    });
    
    return {
      success: true,
      queued: true,
      processingId: event.processingId,
      queuePosition: this.queues[priority].length
    };
  }

  startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    // Main processing loop
    const processLoop = async () => {
      if (!this.isProcessing) return;
      
      try {
        await this.processBatch();
      } catch (error) {
        console.error('Batch processing error:', error);
      }
      
      // Schedule next iteration
      setTimeout(processLoop, this.config.batchInterval);
    };
    
    processLoop();
    console.log('Event processing started');
  }

  async processBatch() {
    const batchStartTime = Date.now();
    
    // Collect events from all queues (priority order)
    const batch = this.collectBatchEvents();
    
    if (batch.length === 0) return;
    
    console.log(`Processing batch of ${batch.length} events`);
    
    // Process events in parallel with concurrency limit
    const concurrencyLimit = 10;
    const chunks = this.chunkArray(batch, concurrencyLimit);
    
    for (const chunk of chunks) {
      const promises = chunk.map(event => this.processQueuedEvent(event));
      await Promise.allSettled(promises);
    }
    
    const batchTime = Date.now() - batchStartTime;
    this.processingStats.batchesProcessed++;
    
    console.log(`Batch processed in ${batchTime}ms`);
    
    // Check batch performance
    if (batchTime > this.config.processingTimeTarget * 2) {
      console.warn(`Batch processing slow: ${batchTime}ms`);
      this.recordBottleneck('batch_processing', batchTime);
    }
  }

  collectBatchEvents() {
    const batch = [];
    const maxBatch = this.config.batchSize;
    
    // Priority order: critical, high, medium, low
    const priorities = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorities) {
      const queue = this.queues[priority];
      const take = Math.min(queue.length, maxBatch - batch.length);
      
      if (take > 0) {
        batch.push(...queue.splice(0, take));
      }
      
      if (batch.length >= maxBatch) break;
    }
    
    return batch;
  }

  async processQueuedEvent(event) {
    const processingStart = Date.now();
    
    try {
      const result = await this.executeProcessingPipeline(event);
      
      const totalTime = Date.now() - event.queuedAt;
      const processingTime = Date.now() - processingStart;
      
      this.updateProcessingStats(processingTime, true);
      
      return result;
      
    } catch (error) {
      console.error(`Queued event processing failed: ${event.processingId}`, error);
      this.addToRetryQueue(event, error);
      this.processingStats.failed++;
    }
  }

  async executeProcessingPipeline(event) {
    const stageTimings = {};
    const pipelineStart = Date.now();
    
    try {
      // Stage 1: Enrichment
      const enrichStart = Date.now();
      const enrichedEvent = await this.enrichEvent(event);
      stageTimings.enrichment = Date.now() - enrichStart;
      
      // Stage 2: Deduplication
      const dedupStart = Date.now();
      if (this.config.enableDeduplication) {
        const isDuplicate = await this.checkDuplication(enrichedEvent);
        if (isDuplicate) {
          console.log(`Duplicate event detected: ${event.processingId}`);
          return { status: 'duplicate', processingId: event.processingId };
        }
      }
      stageTimings.deduplication = Date.now() - dedupStart;
      
      // Stage 3: Core Processing
      const processStart = Date.now();
      const processedEvent = await this.processEventCore(enrichedEvent);
      stageTimings.processing = Date.now() - processStart;
      
      // Stage 4: Storage
      const storageStart = Date.now();
      await this.storeEvent(processedEvent);
      stageTimings.storage = Date.now() - storageStart;
      
      // Stage 5: Cache Update
      const cacheStart = Date.now();
      await this.updateCache(processedEvent);
      stageTimings.cache = Date.now() - cacheStart;
      
      // Stage 6: Marketing Automation Triggers
      const automationStart = Date.now();
      await this.triggerAutomation(processedEvent);
      stageTimings.automation = Date.now() - automationStart;
      
      // Stage 7: Notifications
      const notificationStart = Date.now();
      await this.sendNotifications(processedEvent);
      stageTimings.notifications = Date.now() - notificationStart;
      
      const totalPipelineTime = Date.now() - pipelineStart;
      
      // Record stage timings for analysis
      this.recordStageTimings(stageTimings, totalPipelineTime);
      
      return {
        status: 'processed',
        processingId: event.processingId,
        stageTimings,
        totalTime: totalPipelineTime
      };
      
    } catch (error) {
      console.error(`Pipeline execution failed for ${event.processingId}:`, error);
      throw error;
    }
  }

  async enrichEvent(event) {
    // Add contextual data
    const enrichedEvent = {
      ...event,
      enrichedAt: Date.now(),
      serverTimestamp: Date.now(),
      userAgent: event.userAgent || 'unknown',
      ipAddress: event.ipAddress || 'unknown'
    };

    // Add user context if available
    if (event.userId && this.cacheService) {
      try {
        const userContext = await this.cacheService.get(['user_context', event.userId]);
        if (userContext) {
          enrichedEvent.userContext = userContext;
        }
      } catch (error) {
        console.warn('Failed to enrich with user context:', error);
      }
    }

    // Add session context
    if (event.sessionId && this.cacheService) {
      try {
        const sessionContext = await this.cacheService.get(['session', event.sessionId]);
        if (sessionContext) {
          enrichedEvent.sessionContext = sessionContext;
        }
      } catch (error) {
        console.warn('Failed to enrich with session context:', error);
      }
    }

    return enrichedEvent;
  }

  async checkDuplication(event) {
    // Generate deduplication key
    const dedupKey = this.generateDeduplicationKey(event);
    
    // Check in memory cache first
    if (this.deduplicationCache.has(dedupKey)) {
      return true;
    }
    
    // Check in Redis cache
    if (this.cacheService) {
      const exists = await this.cacheService.exists(['dedup', dedupKey]);
      if (exists) {
        // Add to memory cache for faster subsequent checks
        this.deduplicationCache.set(dedupKey, Date.now());
        return true;
      }
    }
    
    // Mark as seen
    this.deduplicationCache.set(dedupKey, Date.now());
    
    if (this.cacheService) {
      await this.cacheService.set(
        ['dedup', dedupKey], 
        true, 
        { ttl: this.config.deduplicationWindow / 1000 }
      );
    }
    
    return false;
  }

  generateDeduplicationKey(event) {
    // Create hash based on key event properties
    const keyProps = {
      eventType: event.eventType,
      userId: event.userId,
      sessionId: event.sessionId,
      data: event.data
    };
    
    return crypto
      .createHash('md5')
      .update(JSON.stringify(keyProps))
      .digest('hex');
  }

  async processEventCore(event) {
    // Core event processing logic
    const processedEvent = {
      ...event,
      processedAt: Date.now(),
      processingVersion: '1.0'
    };

    // Event-specific processing
    switch (event.eventType) {
      case 'page_view':
        processedEvent.pageData = await this.processPageView(event);
        break;
      
      case 'booking_start':
      case 'booking_complete':
        processedEvent.bookingData = await this.processBookingEvent(event);
        break;
      
      case 'user_register':
        processedEvent.userData = await this.processUserRegistration(event);
        break;
      
      default:
        // Generic processing
        processedEvent.genericData = { processed: true };
    }

    return processedEvent;
  }

  async processPageView(event) {
    return {
      page: event.data?.page || 'unknown',
      referrer: event.data?.referrer || 'direct',
      duration: event.data?.duration || 0,
      scrollDepth: event.data?.scrollDepth || 0
    };
  }

  async processBookingEvent(event) {
    return {
      bookingId: event.data?.bookingId,
      serviceType: event.data?.serviceType,
      deviceType: event.data?.deviceType,
      estimatedPrice: event.data?.estimatedPrice
    };
  }

  async processUserRegistration(event) {
    return {
      registrationMethod: event.data?.method || 'direct',
      referralSource: event.data?.referral || 'organic',
      userType: 'new'
    };
  }

  async storeEvent(event) {
    if (!this.databaseService) return;
    
    try {
      // Store in analytics events table
      const query = `
        INSERT INTO analytics_events (
          processing_id, event_type, user_id, session_id, 
          timestamp, server_timestamp, event_data, 
          processing_time, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const params = [
        event.processingId,
        event.eventType,
        event.userId || null,
        event.sessionId,
        new Date(event.timestamp),
        new Date(event.serverTimestamp),
        JSON.stringify(event),
        event.processingTime || 0,
        event.priority
      ];
      
      await this.databaseService.executeQuery(query, params);
      
    } catch (error) {
      console.error('Failed to store event:', error);
      throw error;
    }
  }

  async updateCache(event) {
    if (!this.cacheService) return;
    
    try {
      // Update real-time metrics
      await this.cacheService.increment(['metrics', 'events', 'total']);
      await this.cacheService.increment(['metrics', 'events', event.eventType]);
      
      // Update user activity cache
      if (event.userId) {
        await this.cacheService.set(
          ['user_activity', event.userId], 
          { lastActive: Date.now(), lastEvent: event.eventType },
          { ttl: 3600 } // 1 hour
        );
      }
      
      // Update session cache
      if (event.sessionId) {
        await this.cacheService.set(
          ['session_activity', event.sessionId],
          { lastEvent: Date.now(), eventCount: 1 },
          { ttl: 1800 } // 30 minutes
        );
      }
      
    } catch (error) {
      console.warn('Cache update failed:', error);
      // Don't throw - cache failures shouldn't stop processing
    }
  }

  async triggerAutomation(event) {
    if (!this.marketingAutomation) return;
    
    try {
      // Trigger marketing automation based on event
      await this.marketingAutomation.processEvent(event);
      
    } catch (error) {
      console.warn('Marketing automation trigger failed:', error);
      // Don't throw - automation failures shouldn't stop processing
    }
  }

  async sendNotifications(event) {
    // Send real-time notifications via WebSocket
    this.emit('eventProcessed', {
      eventId: event.processingId,
      eventType: event.eventType,
      userId: event.userId,
      timestamp: Date.now()
    });
  }

  addToRetryQueue(event, error) {
    const retryEvent = {
      ...event,
      retryCount: (event.retryCount || 0) + 1,
      lastError: error.message,
      retryAt: Date.now() + (this.config.retryDelay * Math.pow(this.config.retryBackoff, event.retryCount || 0))
    };
    
    if (retryEvent.retryCount <= this.config.maxRetries) {
      this.retryQueue.push(retryEvent);
      this.processingStats.retried++;
    } else {
      console.error(`Event ${event.processingId} exceeded max retries, moving to failed queue`);
      this.failedEvents.push(retryEvent);
    }
  }

  processRetryQueue() {
    const now = Date.now();
    const readyToRetry = this.retryQueue.filter(event => event.retryAt <= now);
    
    // Remove processed items from retry queue
    this.retryQueue = this.retryQueue.filter(event => event.retryAt > now);
    
    // Add to processing queues
    for (const event of readyToRetry) {
      this.queues[event.priority].push(event);
    }
    
    if (readyToRetry.length > 0) {
      console.log(`Moved ${readyToRetry.length} events from retry queue to processing queues`);
    }
  }

  recordSlowEvent(event, processingTime) {
    this.performanceMetrics.slowEvents.push({
      processingId: event.processingId,
      eventType: event.eventType,
      processingTime,
      timestamp: Date.now()
    });
    
    // Keep only last 50 slow events
    if (this.performanceMetrics.slowEvents.length > 50) {
      this.performanceMetrics.slowEvents.shift();
    }
  }

  recordStageTimings(stageTimings, totalTime) {
    for (const [stage, timing] of Object.entries(stageTimings)) {
      if (!this.performanceMetrics.stageTimings[stage]) {
        this.performanceMetrics.stageTimings[stage] = [];
      }
      
      this.performanceMetrics.stageTimings[stage].push(timing);
      
      // Keep only last 100 timings per stage
      if (this.performanceMetrics.stageTimings[stage].length > 100) {
        this.performanceMetrics.stageTimings[stage].shift();
      }
    }
  }

  recordBottleneck(type, timing) {
    this.performanceMetrics.bottlenecks.push({
      type,
      timing,
      timestamp: Date.now()
    });
    
    // Keep only last 20 bottlenecks
    if (this.performanceMetrics.bottlenecks.length > 20) {
      this.performanceMetrics.bottlenecks.shift();
    }
  }

  updateProcessingStats(processingTime, success) {
    if (success) {
      this.processingStats.processed++;
      this.processingStats.totalProcessingTime += processingTime;
      this.processingStats.avgProcessingTime = 
        this.processingStats.totalProcessingTime / this.processingStats.processed;
    }
    
    this.processingStats.lastProcessedAt = Date.now();
  }

  startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsInterval);
  }

  collectMetrics() {
    const now = Date.now();
    const timeSinceStart = now - (this.processingStats.lastProcessedAt || now);
    
    // Calculate events per second
    this.processingStats.eventsPerSecond = 
      timeSinceStart > 0 ? 
        (this.processingStats.processed / (timeSinceStart / 1000)) : 0;
    
    // Calculate queue metrics
    const queueMetrics = {
      totalQueued: this.getTotalQueueSize(),
      byPriority: {
        critical: this.queues.critical.length,
        high: this.queues.high.length,
        medium: this.queues.medium.length,
        low: this.queues.low.length
      },
      retryQueue: this.retryQueue.length,
      failedEvents: this.failedEvents.length
    };

    // Emit metrics
    this.emit('metricsUpdate', {
      processing: this.processingStats,
      queues: queueMetrics,
      performance: this.performanceMetrics,
      timestamp: now
    });

    // Check performance alerts
    this.checkPerformanceAlerts();
  }

  checkPerformanceAlerts() {
    // Check processing time target
    if (this.processingStats.avgProcessingTime > this.config.processingTimeTarget) {
      this.emit('performanceAlert', {
        type: 'processing_time_exceeded',
        current: this.processingStats.avgProcessingTime,
        target: this.config.processingTimeTarget
      });
    }
    
    // Check queue size
    const totalQueued = this.getTotalQueueSize();
    if (totalQueued > this.config.maxQueueSize * 0.8) {
      this.emit('performanceAlert', {
        type: 'queue_size_warning',
        current: totalQueued,
        max: this.config.maxQueueSize
      });
    }
    
    // Check error rate
    const totalEvents = this.processingStats.processed + this.processingStats.failed;
    if (totalEvents > 0) {
      const errorRate = (this.processingStats.failed / totalEvents) * 100;
      if (errorRate > 5) { // 5% error rate threshold
        this.emit('performanceAlert', {
          type: 'high_error_rate',
          current: errorRate,
          threshold: 5
        });
      }
    }
  }

  startCleanup() {
    setInterval(() => {
      this.cleanupCaches();
      this.processRetryQueue();
    }, this.config.cleanupInterval);
  }

  cleanupCaches() {
    const now = Date.now();
    const maxAge = this.config.deduplicationWindow;
    
    // Clean deduplication cache
    for (const [key, timestamp] of this.deduplicationCache) {
      if (now - timestamp > maxAge) {
        this.deduplicationCache.delete(key);
      }
    }
    
    // Clean failed events older than 1 hour
    this.failedEvents = this.failedEvents.filter(
      event => (now - event.timestamp) < 3600000
    );
  }

  getTotalQueueSize() {
    return Object.values(this.queues).reduce((total, queue) => total + queue.length, 0);
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  getMetrics() {
    return {
      processing: this.processingStats,
      queues: {
        totalQueued: this.getTotalQueueSize(),
        byPriority: {
          critical: this.queues.critical.length,
          high: this.queues.high.length,
          medium: this.queues.medium.length,
          low: this.queues.low.length
        },
        retryQueue: this.retryQueue.length,
        failedEvents: this.failedEvents.length
      },
      performance: this.performanceMetrics,
      deduplicationCache: this.deduplicationCache.size
    };
  }

  async getHealth() {
    const metrics = this.getMetrics();
    
    return {
      status: this.determineHealthStatus(metrics),
      isProcessing: this.isProcessing,
      metrics,
      timestamp: Date.now()
    };
  }

  determineHealthStatus(metrics) {
    // Check if processing is healthy
    if (!this.isProcessing) return 'unhealthy';
    
    // Check processing time
    if (metrics.processing.avgProcessingTime > this.config.processingTimeTarget * 2) {
      return 'degraded';
    }
    
    // Check queue size
    if (metrics.queues.totalQueued > this.config.maxQueueSize * 0.9) {
      return 'degraded';
    }
    
    // Check error rate
    const totalEvents = metrics.processing.processed + metrics.processing.failed;
    if (totalEvents > 0) {
      const errorRate = (metrics.processing.failed / totalEvents) * 100;
      if (errorRate > 10) return 'unhealthy';
      if (errorRate > 5) return 'degraded';
    }
    
    return 'healthy';
  }

  stop() {
    console.log('Stopping EventProcessor...');
    this.isProcessing = false;
    this.removeAllListeners();
    console.log('EventProcessor stopped');
  }
}

module.exports = { EventProcessor };