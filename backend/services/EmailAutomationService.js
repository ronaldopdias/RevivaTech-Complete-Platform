const EventEmitter = require('events');
const EmailTemplateEngine = require('./EmailTemplateEngine');

class EmailAutomationService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableWorkflows: true,
      enableScheduling: true,
      enableRetries: true,
      maxRetries: 3,
      retryDelay: 300000, // 5 minutes
      queueProcessingInterval: 30000, // 30 seconds
      maxQueueSize: 10000,
      enableRateLimiting: true,
      emailsPerMinute: 100,
      enableCompliance: true,
      respectUnsubscribes: true,
      ...options
    };

    this.templateEngine = new EmailTemplateEngine();
    this.activeWorkflows = new Map();
    this.emailQueue = [];
    this.scheduledEmails = new Map();
    this.rateLimitCounter = 0;
    this.isProcessingQueue = false;
    
    // Performance metrics
    this.metrics = {
      workflowsTriggered: 0,
      emailsQueued: 0,
      emailsSent: 0,
      emailsFailed: 0,
      averageProcessingTime: 0,
      queueProcessingErrors: 0
    };

    this.setupWorkflowTriggers();
  }

  async initialize() {
    try {
      
      // Initialize template engine
      await this.templateEngine.initialize();
      
      // Load active workflows
      await this.loadActiveWorkflows();
      
      // Start queue processor
      this.startQueueProcessor();
      
      // Setup rate limiting reset
      this.setupRateLimitReset();
      
      return true;
    } catch (error) {
      console.error('❌ Email Automation Service initialization failed:', error);
      throw error;
    }
  }

  setupWorkflowTriggers() {
    // Define automation workflow templates
    const workflowTemplates = [
      {
        id: 'booking_abandoned',
        name: 'Booking Abandonment Recovery',
        triggerType: 'booking_abandoned',
        triggerConditions: {
          stage: { operator: '>=', value: 2 },
          timeElapsed: { operator: '>=', value: 1800000 } // 30 minutes
        },
        steps: [
          {
            delay: 0,
            templateId: 'booking_recovery_immediate',
            conditions: {}
          },
          {
            delay: 86400000, // 24 hours
            templateId: 'booking_recovery_followup',
            conditions: { bookingNotCompleted: true }
          },
          {
            delay: 259200000, // 3 days
            templateId: 'booking_recovery_final',
            conditions: { bookingNotCompleted: true }
          }
        ]
      },
      {
        id: 'repair_status_updates',
        name: 'Repair Status Updates',
        triggerType: 'repair_status_changed',
        triggerConditions: {},
        steps: [
          {
            delay: 0,
            templateId: 'repair_status_notification',
            conditions: {}
          }
        ]
      },
      {
        id: 'welcome_series',
        name: 'Customer Welcome Series',
        triggerType: 'customer_registered',
        triggerConditions: {},
        steps: [
          {
            delay: 0,
            templateId: 'welcome_immediate',
            conditions: {}
          },
          {
            delay: 86400000, // 1 day
            templateId: 'welcome_getting_started',
            conditions: { noBookingYet: true }
          },
          {
            delay: 604800000, // 7 days
            templateId: 'welcome_tips_and_tricks',
            conditions: { noBookingYet: true }
          }
        ]
      },
      {
        id: 'repair_completed',
        name: 'Repair Completion Follow-up',
        triggerType: 'repair_completed',
        triggerConditions: {},
        steps: [
          {
            delay: 0,
            templateId: 'repair_completion_notification',
            conditions: {}
          },
          {
            delay: 86400000, // 1 day
            templateId: 'feedback_request',
            conditions: {}
          },
          {
            delay: 604800000, // 7 days
            templateId: 'maintenance_tips',
            conditions: {}
          }
        ]
      },
      {
        id: 'customer_reactivation',
        name: 'Customer Reactivation Campaign',
        triggerType: 'customer_inactive',
        triggerConditions: {
          daysSinceLastVisit: { operator: '>=', value: 90 }
        },
        steps: [
          {
            delay: 0,
            templateId: 'reactivation_special_offer',
            conditions: {}
          },
          {
            delay: 1209600000, // 14 days
            templateId: 'reactivation_final_attempt',
            conditions: { stillInactive: true }
          }
        ]
      }
    ];

    workflowTemplates.forEach(workflow => {
      this.activeWorkflows.set(workflow.id, workflow);
    });

    console.log(`📋 Configured ${workflowTemplates.length} email automation workflows`);
  }

  async loadActiveWorkflows() {
    // In production, this would load workflows from database
    // For now, we use the predefined templates
    
    // Mock database call to load custom workflows
    const customWorkflows = await this.fetchWorkflowsFromDatabase();
    
    customWorkflows.forEach(workflow => {
      this.activeWorkflows.set(workflow.id, workflow);
    });
  }

  async fetchWorkflowsFromDatabase() {
    // Mock implementation - replace with actual database query
    return [];
  }

  async triggerWorkflow(triggerType, eventData, context = {}) {
    const startTime = Date.now();
    
    try {
      const triggeredWorkflows = [];

      // Find workflows that match this trigger
      for (const [workflowId, workflow] of this.activeWorkflows) {
        if (workflow.triggerType === triggerType) {
          // Check trigger conditions
          if (await this.evaluateTriggerConditions(workflow.triggerConditions, eventData)) {
            // Create workflow execution instance
            const execution = {
              id: `${workflowId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workflowId,
              triggerType,
              eventData,
              context,
              status: 'active',
              currentStep: 0,
              startedAt: Date.now(),
              scheduledSteps: []
            };

            // Schedule workflow steps
            await this.scheduleWorkflowSteps(execution);
            triggeredWorkflows.push(execution);

          }
        }
      }

      this.metrics.workflowsTriggered += triggeredWorkflows.length;
      
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);

      return {
        success: true,
        triggeredWorkflows: triggeredWorkflows.length,
        executions: triggeredWorkflows.map(e => e.id),
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, false);
      
      console.error('❌ Workflow trigger failed:', error);
      throw error;
    }
  }

  async evaluateTriggerConditions(conditions, eventData) {
    for (const [field, condition] of Object.entries(conditions)) {
      const value = this.getNestedValue(eventData, field);
      
      if (!this.evaluateCondition(value, condition)) {
        return false;
      }
    }
    return true;
  }

  evaluateCondition(value, condition) {
    const { operator, value: expectedValue } = condition;
    
    switch (operator) {
      case '>=': return value >= expectedValue;
      case '<=': return value <= expectedValue;
      case '>': return value > expectedValue;
      case '<': return value < expectedValue;
      case '==': return value == expectedValue;
      case '===': return value === expectedValue;
      case '!=': return value != expectedValue;
      case '!==': return value !== expectedValue;
      case 'contains': return String(value).includes(expectedValue);
      case 'startsWith': return String(value).startsWith(expectedValue);
      case 'endsWith': return String(value).endsWith(expectedValue);
      default: return true;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async scheduleWorkflowSteps(execution) {
    const workflow = this.activeWorkflows.get(execution.workflowId);
    if (!workflow) return;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const scheduledTime = Date.now() + step.delay;
      
      const scheduledStep = {
        executionId: execution.id,
        stepIndex: i,
        templateId: step.templateId,
        scheduledTime,
        conditions: step.conditions,
        status: 'scheduled',
        eventData: execution.eventData,
        context: execution.context
      };

      execution.scheduledSteps.push(scheduledStep);

      // Add to global schedule
      this.scheduledEmails.set(`${execution.id}_${i}`, scheduledStep);

      console.log(`📅 Scheduled email step ${i + 1} for ${new Date(scheduledTime).toISOString()}`);
    }
  }

  async processScheduledEmails() {
    const now = Date.now();
    const readyEmails = [];

    // Find emails ready to send
    for (const [key, scheduledEmail] of this.scheduledEmails) {
      if (scheduledEmail.scheduledTime <= now && scheduledEmail.status === 'scheduled') {
        readyEmails.push({ key, email: scheduledEmail });
      }
    }

    // Process ready emails
    for (const { key, email } of readyEmails) {
      try {
        // Check step conditions
        if (await this.evaluateStepConditions(email.conditions, email.eventData, email.context)) {
          await this.queueEmail(email);
          
          // Update status
          email.status = 'queued';
          this.scheduledEmails.set(key, email);
        } else {
          // Skip this step
          email.status = 'skipped';
          this.scheduledEmails.set(key, email);
        }
      } catch (error) {
        console.error(`❌ Failed to process scheduled email ${key}:`, error);
        email.status = 'failed';
        email.error = error.message;
        this.scheduledEmails.set(key, email);
      }
    }

    // Clean up old completed/failed emails
    this.cleanupOldScheduledEmails();
  }

  async evaluateStepConditions(conditions, eventData, context) {
    // Custom conditions for workflow steps
    for (const [condition, value] of Object.entries(conditions)) {
      switch (condition) {
        case 'bookingNotCompleted':
          if (value && eventData.booking?.status === 'completed') {
            return false;
          }
          break;
        case 'noBookingYet':
          if (value && context.hasBooking) {
            return false;
          }
          break;
        case 'stillInactive':
          if (value && context.hasRecentActivity) {
            return false;
          }
          break;
        default:
          // Standard condition evaluation
          if (!this.evaluateCondition(this.getNestedValue(eventData, condition), value)) {
            return false;
          }
      }
    }
    return true;
  }

  async queueEmail(scheduledEmail) {
    // Check compliance before queueing
    if (this.options.enableCompliance) {
      const complianceCheck = await this.checkEmailCompliance(scheduledEmail);
      if (!complianceCheck.allowed) {
        console.log(`🚫 Email blocked by compliance: ${complianceCheck.reason}`);
        return;
      }
    }

    // Prepare email data
    const emailData = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: scheduledEmail.templateId,
      recipientEmail: scheduledEmail.eventData.email || scheduledEmail.eventData.user?.email,
      recipientData: {
        user: scheduledEmail.eventData.user || {},
        repair: scheduledEmail.eventData.repair || {},
        booking: scheduledEmail.eventData.booking || {},
        ...scheduledEmail.context
      },
      priority: this.getEmailPriority(scheduledEmail.templateId),
      scheduledTime: scheduledEmail.scheduledTime,
      workflowExecutionId: scheduledEmail.executionId,
      retryCount: 0,
      status: 'queued'
    };

    // Add to queue
    this.emailQueue.push(emailData);
    this.metrics.emailsQueued++;

    console.log(`📧 Queued email: ${emailData.templateId} to ${emailData.recipientEmail}`);
  }

  getEmailPriority(templateId) {
    const highPriority = ['repair_completion_notification', 'booking_confirmation', 'payment_receipt'];
    const mediumPriority = ['repair_status_notification', 'welcome_immediate'];
    
    if (highPriority.includes(templateId)) return 'high';
    if (mediumPriority.includes(templateId)) return 'medium';
    return 'low';
  }

  async checkEmailCompliance(scheduledEmail) {
    // Check unsubscribe status
    if (this.options.respectUnsubscribes) {
      const isUnsubscribed = await this.checkUnsubscribeStatus(scheduledEmail.eventData.email);
      if (isUnsubscribed) {
        return { allowed: false, reason: 'User unsubscribed' };
      }
    }

    // Check email preferences
    const preferences = await this.getEmailPreferences(scheduledEmail.eventData.email);
    if (preferences && !this.isEmailTypeAllowed(scheduledEmail.templateId, preferences)) {
      return { allowed: false, reason: 'Email type not allowed by user preferences' };
    }

    // Check rate limits per user
    const userEmailCount = await this.getUserEmailCount(scheduledEmail.eventData.email, 86400000); // 24 hours
    if (userEmailCount >= 5) { // Max 5 emails per day
      return { allowed: false, reason: 'User daily email limit exceeded' };
    }

    return { allowed: true };
  }

  async checkUnsubscribeStatus(email) {
    // Mock implementation - replace with database query
    return false; // User is not unsubscribed
  }

  async getEmailPreferences(email) {
    // Mock implementation - replace with database query
    return {
      marketing_emails: true,
      transactional_emails: true,
      repair_updates: true,
      promotional_offers: false
    };
  }

  isEmailTypeAllowed(templateId, preferences) {
    const emailTypes = {
      'booking_confirmation': 'transactional_emails',
      'repair_status_notification': 'repair_updates',
      'welcome_immediate': 'transactional_emails',
      'reactivation_special_offer': 'promotional_offers',
      'feedback_request': 'transactional_emails'
    };

    const emailType = emailTypes[templateId] || 'marketing_emails';
    return preferences[emailType] === true;
  }

  async getUserEmailCount(email, timeWindow) {
    // Mock implementation - replace with database query
    return 2; // User has received 2 emails in the time window
  }

  async startQueueProcessor() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    setInterval(async () => {
      try {
        await this.processScheduledEmails();
        await this.processEmailQueue();
      } catch (error) {
        console.error('❌ Queue processing error:', error);
        this.metrics.queueProcessingErrors++;
      }
    }, this.options.queueProcessingInterval);

  }

  async processEmailQueue() {
    if (this.emailQueue.length === 0) return;

    // Sort queue by priority and scheduled time
    this.emailQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.scheduledTime - b.scheduledTime;
    });

    // Process emails within rate limits
    const emailsToProcess = Math.min(
      this.emailQueue.length,
      this.options.emailsPerMinute - this.rateLimitCounter,
      10 // Process max 10 at a time
    );

    for (let i = 0; i < emailsToProcess; i++) {
      const email = this.emailQueue.shift();
      
      try {
        await this.sendEmail(email);
        this.rateLimitCounter++;
        this.metrics.emailsSent++;
      } catch (error) {
        await this.handleEmailFailure(email, error);
      }
    }
  }

  async sendEmail(emailData) {
    try {
      // Render template
      const renderedEmail = await this.templateEngine.renderTemplate(
        emailData.templateId,
        emailData.recipientData,
        {
          email_send_id: emailData.id,
          unsubscribe_token: this.generateUnsubscribeToken(emailData.recipientEmail),
          preference_token: this.generatePreferenceToken(emailData.recipientEmail)
        }
      );

      // Mock email sending (replace with actual email service)
      const sendResult = await this.sendViaEmailService({
        to: emailData.recipientEmail,
        subject: renderedEmail.subject,
        html: renderedEmail.html,
        text: renderedEmail.text,
        metadata: {
          emailId: emailData.id,
          templateId: emailData.templateId,
          workflowExecutionId: emailData.workflowExecutionId
        }
      });

      // Log successful send
      
      // Emit success event
      this.emit('emailSent', {
        emailId: emailData.id,
        templateId: emailData.templateId,
        recipient: emailData.recipientEmail,
        timestamp: Date.now()
      });

      return sendResult;
    } catch (error) {
      console.error(`❌ Email send failed: ${emailData.id}`, error);
      throw error;
    }
  }

  async sendViaEmailService(emailData) {
    // Mock implementation - replace with actual email service (SendGrid, etc.)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          messageId: `msg_${Date.now()}`,
          status: 'sent',
          timestamp: Date.now()
        });
      }, 100);
    });
  }

  async handleEmailFailure(emailData, error) {
    emailData.retryCount++;
    emailData.lastError = error.message;
    
    if (emailData.retryCount < this.options.maxRetries) {
      // Schedule retry
      setTimeout(() => {
        this.emailQueue.unshift(emailData);
      }, this.options.retryDelay);
      
    } else {
      // Mark as permanently failed
      emailData.status = 'failed';
      this.metrics.emailsFailed++;
      
      console.error(`💀 Email permanently failed after ${this.options.maxRetries} retries: ${emailData.id}`);
      
      // Emit failure event
      this.emit('emailFailed', {
        emailId: emailData.id,
        templateId: emailData.templateId,
        recipient: emailData.recipientEmail,
        error: error.message,
        retryCount: emailData.retryCount,
        timestamp: Date.now()
      });
    }
  }

  generateUnsubscribeToken(email) {
    // Simple token generation - use proper encryption in production
    return Buffer.from(`${email}:${Date.now()}`).toString('base64');
  }

  generatePreferenceToken(email) {
    // Simple token generation - use proper encryption in production
    return Buffer.from(`pref:${email}:${Date.now()}`).toString('base64');
  }

  setupRateLimitReset() {
    // Reset rate limit counter every minute
    setInterval(() => {
      this.rateLimitCounter = 0;
    }, 60000);
  }

  cleanupOldScheduledEmails() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const [key, email] of this.scheduledEmails) {
      if (email.scheduledTime < oneWeekAgo && 
          ['completed', 'failed', 'skipped'].includes(email.status)) {
        this.scheduledEmails.delete(key);
      }
    }
  }

  updateMetrics(processingTime, success) {
    if (success) {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * (this.metrics.workflowsTriggered - 1) + processingTime) / 
        this.metrics.workflowsTriggered;
    }
  }

  // Public API methods
  async createWorkflow(workflowData) {
    // Validate workflow
    const validation = this.validateWorkflow(workflowData);
    if (!validation.valid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }

    // Save to database and add to active workflows
    const workflow = {
      ...workflowData,
      id: `workflow_${Date.now()}`,
      created_at: Date.now(),
      is_active: true
    };

    this.activeWorkflows.set(workflow.id, workflow);
    
    return workflow;
  }

  validateWorkflow(workflowData) {
    const errors = [];

    if (!workflowData.name) errors.push('Workflow name is required');
    if (!workflowData.triggerType) errors.push('Trigger type is required');
    if (!workflowData.steps || !Array.isArray(workflowData.steps)) {
      errors.push('Workflow steps are required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async pauseWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.is_active = false;
      return true;
    }
    return false;
  }

  async resumeWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.is_active = true;
      return true;
    }
    return false;
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeWorkflows: this.activeWorkflows.size,
      queueLength: this.emailQueue.length,
      scheduledEmails: this.scheduledEmails.size,
      rateLimitUsage: this.rateLimitCounter,
      isProcessingQueue: this.isProcessingQueue
    };
  }

  async getWorkflowExecutions(workflowId, limit = 100) {
    // This would query database for workflow executions
    // Mock implementation
    return [];
  }

  async cancelWorkflowExecution(executionId) {
    // Remove scheduled emails for this execution
    for (const [key, email] of this.scheduledEmails) {
      if (email.executionId === executionId) {
        email.status = 'cancelled';
        this.scheduledEmails.set(key, email);
      }
    }
    
    console.log(`🚫 Cancelled workflow execution: ${executionId}`);
    return true;
  }
}

module.exports = EmailAutomationService;