const EventEmitter = require('events');

class SMSService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      provider: 'twilio', // twilio, aws-sns, whatsapp-business
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
      whatsappBusinessToken: process.env.WHATSAPP_BUSINESS_TOKEN,
      whatsappFromNumber: process.env.WHATSAPP_FROM_NUMBER,
      enableSandbox: process.env.NODE_ENV !== 'production',
      maxRetries: 3,
      retryDelay: 30000, // 30 seconds
      enableTracking: true,
      rateLimiting: {
        enabled: true,
        maxPerMinute: 60,
        maxPerHour: 1000
      },
      ...options
    };

    this.isInitialized = false;
    this.twilioClient = null;
    this.sendQueue = [];
    this.failedMessages = [];
    this.rateLimiter = new Map(); // Track rate limits per phone number
    
    // Metrics
    this.metrics = {
      messagesSent: 0,
      messagesFailed: 0,
      whatsappSent: 0,
      smsSent: 0,
      totalRetries: 0,
      averageResponseTime: 0,
      lastSentAt: null,
      errors: []
    };
  }

  async initialize() {
    try {
      
      if (this.options.provider === 'twilio') {
        await this.initializeTwilio();
      } else {
        throw new Error(`Unsupported SMS provider: ${this.options.provider}`);
      }

      this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error('❌ SMS Service initialization failed:', error);
      throw error;
    }
  }

  async initializeTwilio() {
    if (!this.options.twilioAccountSid || !this.options.twilioAuthToken) {
      throw new Error('Twilio credentials are required');
    }

    // Dynamic import of Twilio SDK
    try {
      const twilio = require('twilio');
      this.twilioClient = twilio(this.options.twilioAccountSid, this.options.twilioAuthToken);
      
      // Test Twilio connection
      await this.testTwilioConnection();
    } catch (error) {
      throw new Error(`Twilio initialization failed: ${error.message}`);
    }
  }

  async testTwilioConnection() {
    try {
      // Test by fetching account details
      await this.twilioClient.api.accounts(this.options.twilioAccountSid).fetch();
    } catch (error) {
      throw new Error(`Twilio connection test failed: ${error.message}`);
    }
  }

  async sendSMS(messageData) {
    if (!this.isInitialized) {
      throw new Error('SMS service not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Validate message data
      this.validateSMSData(messageData);
      
      // Check rate limiting
      if (!this.checkRateLimit(messageData.to)) {
        throw new Error('Rate limit exceeded for this number');
      }
      
      // Prepare message for sending
      const preparedMessage = await this.prepareSMSMessage(messageData);
      
      // Send SMS via provider
      let result;
      if (this.options.provider === 'twilio') {
        result = await this.sendViaTwilio(preparedMessage);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true, 'sms');
      
      // Emit success event
      this.emit('smsSent', {
        messageId: messageData.id,
        recipient: messageData.to,
        providerMessageId: result.sid,
        responseTime,
        timestamp: Date.now()
      });

      
      return {
        success: true,
        messageId: result.sid,
        smsId: messageData.id,
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false, 'sms');
      
      // Handle retry logic
      const retryResult = await this.handleMessageFailure(messageData, error);
      
      if (!retryResult.willRetry) {
        // Emit failure event
        this.emit('smsFailed', {
          messageId: messageData.id,
          recipient: messageData.to,
          error: error.message,
          responseTime,
          timestamp: Date.now()
        });
      }

      throw error;
    }
  }

  async sendWhatsApp(messageData) {
    if (!this.isInitialized) {
      throw new Error('SMS service not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Validate WhatsApp message data
      this.validateWhatsAppData(messageData);
      
      // Check rate limiting
      if (!this.checkRateLimit(messageData.to)) {
        throw new Error('Rate limit exceeded for this number');
      }
      
      // Prepare WhatsApp message
      const preparedMessage = await this.prepareWhatsAppMessage(messageData);
      
      // Send WhatsApp via Twilio
      let result;
      if (this.options.provider === 'twilio') {
        result = await this.sendWhatsAppViaTwilio(preparedMessage);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true, 'whatsapp');
      
      // Emit success event
      this.emit('whatsappSent', {
        messageId: messageData.id,
        recipient: messageData.to,
        providerMessageId: result.sid,
        responseTime,
        timestamp: Date.now()
      });

      
      return {
        success: true,
        messageId: result.sid,
        whatsappId: messageData.id,
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false, 'whatsapp');
      
      // Handle retry logic
      const retryResult = await this.handleMessageFailure(messageData, error);
      
      if (!retryResult.willRetry) {
        // Emit failure event
        this.emit('whatsappFailed', {
          messageId: messageData.id,
          recipient: messageData.to,
          error: error.message,
          responseTime,
          timestamp: Date.now()
        });
      }

      throw error;
    }
  }

  validateSMSData(messageData) {
    const required = ['to', 'body'];
    const missing = required.filter(field => !messageData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required SMS fields: ${missing.join(', ')}`);
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(messageData.to)) {
      throw new Error(`Invalid phone number format: ${messageData.to}`);
    }

    // Validate message length (SMS limit is 160 characters for GSM, 70 for Unicode)
    if (messageData.body.length > 1600) { // Allow for concatenated SMS
      throw new Error(`SMS message too long: ${messageData.body.length} characters`);
    }
  }

  validateWhatsAppData(messageData) {
    const required = ['to', 'body'];
    const missing = required.filter(field => !messageData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required WhatsApp fields: ${missing.join(', ')}`);
    }

    // Validate WhatsApp number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(messageData.to)) {
      throw new Error(`Invalid WhatsApp number format: ${messageData.to}`);
    }

    // WhatsApp has higher character limits
    if (messageData.body.length > 4096) {
      throw new Error(`WhatsApp message too long: ${messageData.body.length} characters`);
    }
  }

  checkRateLimit(phoneNumber) {
    if (!this.options.rateLimiting.enabled) {
      return true;
    }

    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    if (!this.rateLimiter.has(phoneNumber)) {
      this.rateLimiter.set(phoneNumber, {
        minuteCount: 0,
        hourCount: 0,
        lastMinute: now,
        lastHour: now
      });
    }

    const limits = this.rateLimiter.get(phoneNumber);

    // Reset minute counter if a minute has passed
    if (now - limits.lastMinute >= oneMinute) {
      limits.minuteCount = 0;
      limits.lastMinute = now;
    }

    // Reset hour counter if an hour has passed
    if (now - limits.lastHour >= oneHour) {
      limits.hourCount = 0;
      limits.lastHour = now;
    }

    // Check limits
    if (limits.minuteCount >= this.options.rateLimiting.maxPerMinute) {
      return false;
    }

    if (limits.hourCount >= this.options.rateLimiting.maxPerHour) {
      return false;
    }

    // Increment counters
    limits.minuteCount++;
    limits.hourCount++;

    return true;
  }

  async prepareSMSMessage(messageData) {
    return {
      to: messageData.to,
      from: messageData.from || this.options.twilioFromNumber,
      body: messageData.body,
      mediaUrl: messageData.mediaUrl,
      statusCallback: messageData.statusCallback,
      provideFeedback: true,
      attempt: 1
    };
  }

  async prepareWhatsAppMessage(messageData) {
    const whatsappTo = `whatsapp:${messageData.to}`;
    const whatsappFrom = `whatsapp:${messageData.from || this.options.whatsappFromNumber}`;

    return {
      to: whatsappTo,
      from: whatsappFrom,
      body: messageData.body,
      mediaUrl: messageData.mediaUrl,
      statusCallback: messageData.statusCallback,
      provideFeedback: true,
      attempt: 1
    };
  }

  async sendViaTwilio(messageData) {
    try {
      const message = await this.twilioClient.messages.create({
        to: messageData.to,
        from: messageData.from,
        body: messageData.body,
        mediaUrl: messageData.mediaUrl,
        statusCallback: messageData.statusCallback,
        provideFeedback: messageData.provideFeedback
      });

      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        provider: 'twilio'
      };
    } catch (error) {
      console.error('❌ Twilio SMS send failed:', error);
      throw this.parseTwilioError(error);
    }
  }

  async sendWhatsAppViaTwilio(messageData) {
    try {
      const message = await this.twilioClient.messages.create({
        to: messageData.to,
        from: messageData.from,
        body: messageData.body,
        mediaUrl: messageData.mediaUrl,
        statusCallback: messageData.statusCallback,
        provideFeedback: messageData.provideFeedback
      });

      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        provider: 'twilio-whatsapp'
      };
    } catch (error) {
      console.error('❌ Twilio WhatsApp send failed:', error);
      throw this.parseTwilioError(error);
    }
  }

  parseTwilioError(error) {
    if (error.code) {
      switch (error.code) {
        case 21211:
          return new Error('Invalid phone number');
        case 21408:
          return new Error('Permission to send messages to this number denied');
        case 21610:
          return new Error('Number is blacklisted');
        case 30007:
          return new Error('Message delivery failed - number may be invalid');
        default:
          return new Error(`Twilio error ${error.code}: ${error.message}`);
      }
    }
    return error;
  }

  async handleMessageFailure(messageData, error) {
    if (!messageData.retryCount) {
      messageData.retryCount = 0;
    }

    messageData.retryCount++;
    messageData.lastError = error.message;

    if (messageData.retryCount <= this.options.maxRetries) {
      // Schedule retry
      
      setTimeout(async () => {
        try {
          if (messageData.type === 'whatsapp') {
            await this.sendWhatsApp(messageData);
          } else {
            await this.sendSMS(messageData);
          }
        } catch (retryError) {
          console.error(`❌ Retry ${messageData.retryCount} failed for message ${messageData.id}:`, retryError);
        }
      }, this.options.retryDelay * messageData.retryCount); // Exponential backoff

      this.metrics.totalRetries++;
      
      return { willRetry: true, retryCount: messageData.retryCount };
    } else {
      // Mark as permanently failed
      this.failedMessages.push({
        ...messageData,
        finalError: error.message,
        failedAt: Date.now()
      });

      console.error(`💀 Message permanently failed after ${this.options.maxRetries} retries: ${messageData.id}`);
      
      return { willRetry: false, retryCount: messageData.retryCount };
    }
  }

  updateMetrics(responseTime, success, type) {
    if (success) {
      this.metrics.messagesSent++;
      this.metrics.lastSentAt = Date.now();
      
      if (type === 'sms') {
        this.metrics.smsSent++;
      } else if (type === 'whatsapp') {
        this.metrics.whatsappSent++;
      }
    } else {
      this.metrics.messagesFailed++;
      this.metrics.errors.push({
        timestamp: Date.now(),
        type,
        message: 'Message send failed'
      });
    }

    // Update average response time
    const totalMessages = this.metrics.messagesSent + this.metrics.messagesFailed;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalMessages - 1) + responseTime) / totalMessages;

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  // Template-based messaging
  async sendTemplateMessage(templateId, recipientData, messageData = {}) {
    // This would integrate with a template engine
    // For now, it's a placeholder
    const processedMessage = {
      id: `template_${templateId}_${Date.now()}`,
      to: recipientData.phoneNumber,
      body: this.processTemplate(templateId, recipientData),
      type: messageData.type || 'sms',
      metadata: {
        templateId,
        recipientId: recipientData.id
      }
    };

    if (messageData.type === 'whatsapp') {
      return await this.sendWhatsApp(processedMessage);
    } else {
      return await this.sendSMS(processedMessage);
    }
  }

  processTemplate(templateId, data) {
    // Simple template processing - replace with proper template engine
    const templates = {
      'booking_confirmation': `Hi ${data.name || 'Customer'}! Your repair booking has been confirmed for ${data.appointmentDate}. Booking ID: ${data.bookingId}. RevivaTech Team`,
      'repair_update': `Hello ${data.name || 'Customer'}! Update on your ${data.device}: ${data.status}. Estimated completion: ${data.estimatedCompletion}. RevivaTech Team`,
      'ready_for_pickup': `Great news ${data.name || 'Customer'}! Your ${data.device} is ready for pickup. Please bring ID and payment if required. RevivaTech Team`
    };

    return templates[templateId] || `Hello ${data.name || 'Customer'}! Thank you for choosing RevivaTech.`;
  }

  // Bulk messaging
  async sendBulkMessages(messages, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 50;
    const delay = options.delay || 2000; // 2 seconds between batches for rate limiting

    console.log(`📱 Sending ${messages.length} messages in batches of ${batchSize}`);

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(message => {
          if (message.type === 'whatsapp') {
            return this.sendWhatsApp(message);
          } else {
            return this.sendSMS(message);
          }
        })
      );

      // Process batch results
      batchResults.forEach((result, index) => {
        const originalIndex = i + index;
        if (result.status === 'fulfilled') {
          results.push({
            index: originalIndex,
            success: true,
            result: result.value
          });
        } else {
          results.push({
            index: originalIndex,
            success: false,
            error: result.reason.message
          });
        }
      });

      // Delay between batches (except last batch)
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;


    return {
      total: messages.length,
      successful,
      failed,
      results
    };
  }

  // Two-way messaging support
  async handleIncomingMessage(messageData) {
    console.log(`📨 Incoming message from ${messageData.from}: ${messageData.body}`);
    
    // Emit incoming message event for other services to handle
    this.emit('messageReceived', {
      from: messageData.from,
      body: messageData.body,
      messageId: messageData.messageId,
      timestamp: Date.now(),
      provider: messageData.provider
    });

    // Auto-reply logic could go here
    return { received: true, timestamp: Date.now() };
  }

  // Health check
  async healthCheck() {
    try {
      if (this.options.provider === 'twilio') {
        await this.testTwilioConnection();
      }

      return {
        status: 'healthy',
        provider: this.options.provider,
        initialized: this.isInitialized,
        metrics: this.getMetrics(),
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.options.provider,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Get service metrics
  getMetrics() {
    return {
      ...this.metrics,
      queueLength: this.sendQueue.length,
      failedMessagesCount: this.failedMessages.length,
      isInitialized: this.isInitialized,
      provider: this.options.provider,
      rateLimiterEntries: this.rateLimiter.size
    };
  }

  // Clean up failed messages (maintenance)
  cleanupFailedMessages(olderThanDays = 7) {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.failedMessages.length;
    
    this.failedMessages = this.failedMessages.filter(message => message.failedAt > cutoffTime);
    
    const cleanedCount = initialCount - this.failedMessages.length;
    console.log(`🧹 Cleaned up ${cleanedCount} old failed messages`);
    
    return { cleaned: cleanedCount, remaining: this.failedMessages.length };
  }

  // Clean up rate limiter (maintenance)
  cleanupRateLimiter() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [phoneNumber, limits] of this.rateLimiter.entries()) {
      // Remove entries older than 1 hour
      if (now - limits.lastHour > oneHour) {
        this.rateLimiter.delete(phoneNumber);
      }
    }
    
    console.log(`🧹 Rate limiter cleanup complete: ${this.rateLimiter.size} active entries`);
  }
}

module.exports = SMSService;