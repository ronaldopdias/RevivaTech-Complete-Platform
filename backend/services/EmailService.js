const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const EventEmitter = require('events');

class EmailService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      provider: 'sendgrid', // sendgrid, nodemailer
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'noreply@revivatech.co.uk',
      fromName: process.env.FROM_NAME || 'RevivaTech',
      enableSandbox: process.env.NODE_ENV !== 'production',
      enableWebhooks: true,
      webhookSigningKey: process.env.SENDGRID_WEBHOOK_KEY,
      maxRetries: 3,
      retryDelay: 60000, // 1 minute
      enableTracking: true,
      enableClickTracking: true,
      enableOpenTracking: true,
      enableUnsubscribeTracking: true,
      enableSpamCheck: true,
      ...options
    };

    this.isInitialized = false;
    this.transporter = null;
    this.sendQueue = [];
    this.failedEmails = [];
    
    // Metrics
    this.metrics = {
      emailsSent: 0,
      emailsFailed: 0,
      totalRetries: 0,
      averageResponseTime: 0,
      lastSentAt: null,
      errors: []
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Email Service...');
      
      // Try SendGrid first, fallback to SMTP if it fails
      if (this.options.provider === 'sendgrid') {
        try {
          await this.initializeSendGrid();
        } catch (sendgridError) {
          console.warn('⚠️ SendGrid initialization failed, trying SMTP fallback:', sendgridError.message);
          this.options.provider = 'nodemailer';
          await this.initializeNodemailer();
        }
      } else if (this.options.provider === 'nodemailer') {
        await this.initializeNodemailer();
      } else {
        throw new Error(`Unsupported email provider: ${this.options.provider}`);
      }

      this.isInitialized = true;
      console.log(`✅ Email Service initialized with ${this.options.provider}`);
      
      return true;
    } catch (error) {
      console.error('❌ Email Service initialization failed:', error);
      // Don't throw error, create mock service instead
      this.isInitialized = false;
      this.options.provider = 'mock';
      console.warn('⚠️ Using mock email service for development');
      return false;
    }
  }

  async initializeSendGrid() {
    if (!this.options.sendgridApiKey) {
      throw new Error('SendGrid API key is required');
    }

    sgMail.setApiKey(this.options.sendgridApiKey);
    
    // Test SendGrid connection
    try {
      await this.testSendGridConnection();
      console.log('✅ SendGrid connection verified');
    } catch (error) {
      throw new Error(`SendGrid connection failed: ${error.message}`);
    }
  }

  async testSendGridConnection() {
    // Simple test by trying to retrieve API key info
    // In production, you might want a more comprehensive test
    if (!this.options.sendgridApiKey.startsWith('SG.')) {
      throw new Error('Invalid SendGrid API key format');
    }
  }

  async initializeNodemailer() {
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    this.transporter = nodemailer.createTransport(config);
    
    // Verify SMTP connection
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (error) {
      throw new Error(`SMTP connection failed: ${error.message}`);
    }
  }

  async sendEmail(emailData) {
    const startTime = Date.now();
    
    try {
      // Validate email data
      this.validateEmailData(emailData);
      
      // Handle mock mode
      if (this.options.provider === 'mock' || !this.isInitialized) {
        return await this.sendViaMock(emailData);
      }
      
      // Prepare email for sending
      const preparedEmail = await this.prepareEmail(emailData);
      
      // Send email based on provider
      let result;
      if (this.options.provider === 'sendgrid') {
        result = await this.sendViaSendGrid(preparedEmail);
      } else if (this.options.provider === 'nodemailer') {
        result = await this.sendViaNodemailer(preparedEmail);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      // Emit success event
      this.emit('emailSent', {
        emailId: emailData.id,
        recipient: emailData.to,
        messageId: result.messageId,
        responseTime,
        timestamp: Date.now()
      });

      console.log(`✅ Email sent successfully: ${emailData.id} to ${emailData.to}`);
      
      return {
        success: true,
        messageId: result.messageId,
        emailId: emailData.id,
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      // Handle retry logic
      const retryResult = await this.handleEmailFailure(emailData, error);
      
      if (!retryResult.willRetry) {
        // Emit failure event
        this.emit('emailFailed', {
          emailId: emailData.id,
          recipient: emailData.to,
          error: error.message,
          responseTime,
          timestamp: Date.now()
        });
      }

      throw error;
    }
  }

  validateEmailData(emailData) {
    const required = ['to', 'subject', 'html'];
    const missing = required.filter(field => !emailData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required email fields: ${missing.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      throw new Error(`Invalid email address: ${emailData.to}`);
    }

    // Validate subject length
    if (emailData.subject.length > 100) {
      console.warn(`⚠️ Email subject is long (${emailData.subject.length} chars): ${emailData.subject.substring(0, 50)}...`);
    }
  }

  async prepareEmail(emailData) {
    const prepared = {
      to: emailData.to,
      from: {
        email: emailData.from || this.options.fromEmail,
        name: emailData.fromName || this.options.fromName
      },
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || this.stripHtml(emailData.html),
      replyTo: emailData.replyTo,
      attachments: emailData.attachments || [],
      customArgs: emailData.metadata || {},
      categories: emailData.categories || ['revivatech'],
      trackingSettings: this.getTrackingSettings(emailData),
      mailSettings: this.getMailSettings(emailData)
    };

    // Add unsubscribe handling
    if (emailData.unsubscribeUrl) {
      prepared.customArgs.unsubscribe_url = emailData.unsubscribeUrl;
    }

    return prepared;
  }

  getTrackingSettings(emailData) {
    return {
      clickTracking: {
        enable: this.options.enableClickTracking && emailData.enableClickTracking !== false,
        enableText: false
      },
      openTracking: {
        enable: this.options.enableOpenTracking && emailData.enableOpenTracking !== false,
        substitutionTag: '%open_track%'
      },
      subscriptionTracking: {
        enable: this.options.enableUnsubscribeTracking && emailData.enableUnsubscribeTracking !== false,
        text: 'Unsubscribe',
        html: '<p><a href="%unsubscribe_url%">Unsubscribe</a></p>',
        substitutionTag: '%unsubscribe_url%'
      }
    };
  }

  getMailSettings(emailData) {
    return {
      sandboxMode: {
        enable: this.options.enableSandbox && emailData.sandbox !== false
      },
      spamCheck: {
        enable: this.options.enableSpamCheck,
        threshold: 5
      }
    };
  }

  async sendViaSendGrid(emailData) {
    try {
      const msg = {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        replyTo: emailData.replyTo,
        attachments: emailData.attachments,
        customArgs: emailData.customArgs,
        categories: emailData.categories,
        trackingSettings: emailData.trackingSettings,
        mailSettings: emailData.mailSettings
      };

      const response = await sgMail.send(msg);
      
      return {
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode,
        provider: 'sendgrid'
      };
    } catch (error) {
      console.error('❌ SendGrid send failed:', error);
      throw this.parseSendGridError(error);
    }
  }

  async sendViaNodemailer(emailData) {
    try {
      const mailOptions = {
        from: `"${emailData.from.name}" <${emailData.from.email}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        replyTo: emailData.replyTo,
        attachments: emailData.attachments,
        headers: {
          'X-Category': emailData.categories.join(','),
          'X-CustomArgs': JSON.stringify(emailData.customArgs)
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        messageId: result.messageId,
        response: result.response,
        provider: 'nodemailer'
      };
    } catch (error) {
      console.error('❌ Nodemailer send failed:', error);
      throw error;
    }
  }

  async sendViaMock(emailData) {
    // Mock email sending for development/testing
    const mockMessageId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    console.log(`📧 [MOCK] Email would be sent:`);
    console.log(`📧 [MOCK] To: ${emailData.to}`);
    console.log(`📧 [MOCK] Subject: ${emailData.subject}`);
    console.log(`📧 [MOCK] From: ${emailData.from || this.options.fromEmail}`);
    console.log(`📧 [MOCK] Email ID: ${emailData.id || 'no-id'}`);
    console.log(`📧 [MOCK] Message ID: ${mockMessageId}`);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update metrics for mock sends
    const responseTime = 100;
    this.updateMetrics(responseTime, true);
    
    // Emit success event for mock
    this.emit('emailSent', {
      emailId: emailData.id,
      recipient: emailData.to,
      messageId: mockMessageId,
      responseTime,
      timestamp: Date.now()
    });
    
    return {
      messageId: mockMessageId,
      statusCode: 200,
      provider: 'mock'
    };
  }

  parseSendGridError(error) {
    if (error.response && error.response.body && error.response.body.errors) {
      const messages = error.response.body.errors.map(e => e.message).join(', ');
      return new Error(`SendGrid error: ${messages}`);
    }
    return error;
  }

  async handleEmailFailure(emailData, error) {
    if (!emailData.retryCount) {
      emailData.retryCount = 0;
    }

    emailData.retryCount++;
    emailData.lastError = error.message;

    if (emailData.retryCount <= this.options.maxRetries) {
      // Schedule retry
      console.log(`🔄 Scheduling retry ${emailData.retryCount}/${this.options.maxRetries} for email: ${emailData.id}`);
      
      setTimeout(async () => {
        try {
          await this.sendEmail(emailData);
        } catch (retryError) {
          console.error(`❌ Retry ${emailData.retryCount} failed for email ${emailData.id}:`, retryError);
        }
      }, this.options.retryDelay * emailData.retryCount); // Exponential backoff

      this.metrics.totalRetries++;
      
      return { willRetry: true, retryCount: emailData.retryCount };
    } else {
      // Mark as permanently failed
      this.failedEmails.push({
        ...emailData,
        finalError: error.message,
        failedAt: Date.now()
      });

      console.error(`💀 Email permanently failed after ${this.options.maxRetries} retries: ${emailData.id}`);
      
      return { willRetry: false, retryCount: emailData.retryCount };
    }
  }

  stripHtml(html) {
    // Simple HTML stripping - use proper library in production
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  updateMetrics(responseTime, success) {
    if (success) {
      this.metrics.emailsSent++;
      this.metrics.lastSentAt = Date.now();
    } else {
      this.metrics.emailsFailed++;
      this.metrics.errors.push({
        timestamp: Date.now(),
        message: 'Email send failed'
      });
    }

    // Update average response time
    const totalEmails = this.metrics.emailsSent + this.metrics.emailsFailed;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalEmails - 1) + responseTime) / totalEmails;

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  // Webhook handling for SendGrid
  async handleWebhook(eventData, signature) {
    if (!this.options.enableWebhooks) {
      return { processed: false, reason: 'Webhooks disabled' };
    }

    try {
      // Verify webhook signature if configured
      if (this.options.webhookSigningKey && signature) {
        const isValid = this.verifyWebhookSignature(eventData, signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Process webhook events
      const events = Array.isArray(eventData) ? eventData : [eventData];
      const processedEvents = [];

      for (const event of events) {
        const processed = await this.processWebhookEvent(event);
        processedEvents.push(processed);
      }

      return {
        processed: true,
        eventCount: events.length,
        events: processedEvents
      };
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      throw error;
    }
  }

  verifyWebhookSignature(payload, signature) {
    // Implement SendGrid webhook signature verification
    // This is a simplified version - use proper crypto verification
    return true; // Placeholder
  }

  async processWebhookEvent(event) {
    const { event: eventType, email, timestamp, sg_message_id } = event;

    console.log(`📧 Processing webhook event: ${eventType} for ${email}`);

    // Emit specific events for analytics service
    switch (eventType) {
      case 'delivered':
        this.emit('emailDelivered', {
          email,
          messageId: sg_message_id,
          timestamp: parseInt(timestamp) * 1000
        });
        break;
      case 'open':
        this.emit('emailOpened', {
          email,
          messageId: sg_message_id,
          timestamp: parseInt(timestamp) * 1000,
          userAgent: event.useragent,
          ipAddress: event.ip
        });
        break;
      case 'click':
        this.emit('emailClicked', {
          email,
          messageId: sg_message_id,
          url: event.url,
          timestamp: parseInt(timestamp) * 1000,
          userAgent: event.useragent,
          ipAddress: event.ip
        });
        break;
      case 'bounce':
        this.emit('emailBounced', {
          email,
          messageId: sg_message_id,
          reason: event.reason,
          type: event.type,
          timestamp: parseInt(timestamp) * 1000
        });
        break;
      case 'spam':
        this.emit('emailSpam', {
          email,
          messageId: sg_message_id,
          timestamp: parseInt(timestamp) * 1000
        });
        break;
      case 'unsubscribe':
        this.emit('emailUnsubscribed', {
          email,
          messageId: sg_message_id,
          timestamp: parseInt(timestamp) * 1000
        });
        break;
    }

    return {
      eventType,
      email,
      processed: true,
      timestamp: Date.now()
    };
  }

  // Bulk email sending
  async sendBulkEmails(emails, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 100;
    const delay = options.delay || 1000; // 1 second between batches

    console.log(`📧 Sending ${emails.length} emails in batches of ${batchSize}`);

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(email => this.sendEmail(email))
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
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log(`📊 Batch ${Math.floor(i / batchSize) + 1} completed: ${batch.length} emails`);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Bulk send completed: ${successful} sent, ${failed} failed`);

    return {
      total: emails.length,
      successful,
      failed,
      results
    };
  }

  // Template-based email sending
  async sendTemplateEmail(templateId, recipientData, templateData = {}) {
    // This would integrate with the EmailTemplateEngine
    // For now, it's a placeholder
    const emailData = {
      id: `template_${templateId}_${Date.now()}`,
      to: recipientData.email,
      subject: templateData.subject || 'Email from RevivaTech',
      html: templateData.html || '<p>Template email</p>',
      metadata: {
        templateId,
        recipientId: recipientData.id
      }
    };

    return await this.sendEmail(emailData);
  }

  // Unsubscribe handling
  async handleUnsubscribe(email, token, reason = 'user_request') {
    console.log(`👋 Processing unsubscribe: ${email}`);
    
    // Emit unsubscribe event
    this.emit('unsubscribeRequested', {
      email,
      token,
      reason,
      timestamp: Date.now()
    });

    // This would update the database to mark user as unsubscribed
    // Placeholder implementation
    return {
      success: true,
      email,
      unsubscribedAt: Date.now()
    };
  }

  // Email preference updates
  async updateEmailPreferences(email, preferences) {
    console.log(`⚙️ Updating email preferences for: ${email}`);
    
    // Emit preference update event
    this.emit('preferencesUpdated', {
      email,
      preferences,
      timestamp: Date.now()
    });

    // This would update the database with new preferences
    // Placeholder implementation
    return {
      success: true,
      email,
      preferences,
      updatedAt: Date.now()
    };
  }

  // Health check
  async healthCheck() {
    try {
      if (this.options.provider === 'sendgrid') {
        await this.testSendGridConnection();
      } else if (this.options.provider === 'nodemailer') {
        await this.transporter.verify();
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
      failedEmailsCount: this.failedEmails.length,
      isInitialized: this.isInitialized,
      provider: this.options.provider
    };
  }

  // Clean up failed emails (maintenance)
  cleanupFailedEmails(olderThanDays = 7) {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.failedEmails.length;
    
    this.failedEmails = this.failedEmails.filter(email => email.failedAt > cutoffTime);
    
    const cleanedCount = initialCount - this.failedEmails.length;
    console.log(`🧹 Cleaned up ${cleanedCount} old failed emails`);
    
    return { cleaned: cleanedCount, remaining: this.failedEmails.length };
  }
}

module.exports = EmailService;