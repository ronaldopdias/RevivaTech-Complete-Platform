const EventEmitter = require('events');
const MLService = require('./MLService');

class MarketingAutomation extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      responseTime: 500, // Target <500ms response time
      enablePersonalization: true,
      enableBehavioralTriggers: true,
      enableAudienceSync: true,
      ...options
    };
    
    this.mlService = new MLService();
    this.triggers = new Map();
    this.activeAutomations = new Map();
    this.eventQueue = [];
    this.isProcessing = false;
    
    // Performance tracking
    this.metrics = {
      triggersProcessed: 0,
      averageResponseTime: 0,
      automationSuccess: 0,
      errors: 0
    };
    
    this.setupEventTriggers();
  }

  async initialize() {
    try {
      
      // Initialize ML Service for intelligent triggers
      await this.mlService.initialize();
      
      // Setup event processing
      this.startEventProcessor();
      
      return true;
    } catch (error) {
      console.error('❌ Marketing Automation initialization failed:', error);
      throw error;
    }
  }

  setupEventTriggers() {
    // Define marketing automation triggers
    const triggers = [
      {
        id: 'booking_abandoned',
        name: 'Booking Abandoned',
        condition: (event) => event.type === 'booking_abandon' && event.stage >= 2,
        action: 'send_recovery_email',
        delay: 1800000, // 30 minutes
        priority: 'high'
      },
      {
        id: 'high_engagement_no_conversion',
        name: 'High Engagement No Conversion',
        condition: (event) => event.type === 'session_end' && 
                             event.engagement_score > 75 && 
                             !event.conversion,
        action: 'send_consultation_offer',
        delay: 3600000, // 1 hour
        priority: 'medium'
      },
      {
        id: 'customer_inactive',
        name: 'Customer Inactive',
        condition: (event) => event.type === 'customer_inactive' && 
                             event.days_since_last_visit > 30,
        action: 'send_reactivation_campaign',
        delay: 0,
        priority: 'low'
      },
      {
        id: 'price_check_multiple',
        name: 'Multiple Price Checks',
        condition: (event) => event.type === 'price_check' && 
                             event.count >= 3 && 
                             event.timeframe <= 3600000, // 1 hour
        action: 'send_discount_offer',
        delay: 900000, // 15 minutes
        priority: 'high'
      },
      {
        id: 'service_completed',
        name: 'Service Completed',
        condition: (event) => event.type === 'repair_completed',
        action: 'send_feedback_request',
        delay: 86400000, // 24 hours
        priority: 'medium'
      },
      {
        id: 'repeat_visitor_no_booking',
        name: 'Repeat Visitor No Booking',
        condition: (event) => event.type === 'page_view' && 
                             event.visit_count >= 3 && 
                             !event.has_booking,
        action: 'show_chat_prompt',
        delay: 0,
        priority: 'medium'
      }
    ];

    triggers.forEach(trigger => {
      this.triggers.set(trigger.id, trigger);
    });

    console.log(`📋 Configured ${triggers.length} marketing automation triggers`);
  }

  async processEvent(eventData) {
    const startTime = Date.now();
    
    try {
      // Add event to queue for processing
      this.eventQueue.push({
        ...eventData,
        timestamp: Date.now(),
        processed: false
      });

      // Process immediately if under response time target
      if (!this.isProcessing) {
        await this.processEventQueue();
      }

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      return {
        success: true,
        responseTime,
        triggersEvaluated: this.triggers.size,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      console.error('❌ Event processing failed:', error);
      return {
        success: false,
        error: error.message,
        responseTime,
        timestamp: Date.now()
      };
    }
  }

  async processEventQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event.processed) {
          await this.evaluateTriggersForEvent(event);
          event.processed = true;
        }
      }
    } catch (error) {
      console.error('❌ Event queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async evaluateTriggersForEvent(event) {
    const triggeredAutomations = [];

    for (const [triggerId, trigger] of this.triggers) {
      try {
        // Check if trigger condition is met
        if (trigger.condition(event)) {
          // Get ML-enhanced context
          const context = await this.getMLContext(event);
          
          // Create automation instance
          const automation = {
            id: `${triggerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            triggerId,
            eventId: event.id || event.timestamp,
            context,
            scheduledFor: Date.now() + trigger.delay,
            priority: trigger.priority,
            status: 'scheduled'
          };

          // Schedule automation
          await this.scheduleAutomation(automation);
          triggeredAutomations.push(automation);

        }
      } catch (error) {
        console.error(`❌ Trigger evaluation failed for ${triggerId}:`, error);
      }
    }

    return triggeredAutomations;
  }

  async getMLContext(event) {
    try {
      const context = {
        leadScore: null,
        churnRisk: null,
        customerSegment: null,
        personalizationData: {}
      };

      // Get lead scoring if applicable
      if (event.type === 'booking_abandon' || event.type === 'high_engagement') {
        context.leadScore = await this.mlService.scoreLeads([{
          engagement_score: event.engagement_score || 50,
          pages_visited: event.pages_visited || 1,
          time_on_site: event.time_on_site || 0,
          device_type: event.device_type || 'desktop',
          traffic_source: event.traffic_source || 'direct'
        }]);
      }

      // Get churn prediction for existing customers
      if (event.customer_id) {
        context.churnRisk = await this.mlService.predictChurn([{
          customer_id: event.customer_id,
          days_since_last_visit: event.days_since_last_visit || 0,
          total_orders: event.total_orders || 0,
          avg_order_value: event.avg_order_value || 0
        }]);
      }

      // Get customer segmentation
      if (event.user_id || event.customer_id) {
        context.customerSegment = await this.mlService.segmentCustomers([{
          user_id: event.user_id || event.customer_id,
          behavior_data: event.behavior_data || {},
          demographics: event.demographics || {}
        }]);
      }

      return context;
    } catch (error) {
      console.error('❌ ML context generation failed:', error);
      return {};
    }
  }

  async scheduleAutomation(automation) {
    try {
      this.activeAutomations.set(automation.id, automation);

      if (automation.scheduledFor <= Date.now()) {
        // Execute immediately
        await this.executeAutomation(automation);
      } else {
        // Schedule for later execution
        setTimeout(async () => {
          await this.executeAutomation(automation);
        }, automation.scheduledFor - Date.now());
      }

      return automation.id;
    } catch (error) {
      console.error('❌ Automation scheduling failed:', error);
      throw error;
    }
  }

  async executeAutomation(automation) {
    try {
      automation.status = 'executing';
      automation.executedAt = Date.now();

      const trigger = this.triggers.get(automation.triggerId);
      if (!trigger) {
        throw new Error(`Trigger not found: ${automation.triggerId}`);
      }

      // Execute the automation action
      const result = await this.executeAction(trigger.action, automation);

      automation.status = 'completed';
      automation.result = result;

      // Emit automation completed event
      this.emit('automationCompleted', {
        automationId: automation.id,
        triggerId: automation.triggerId,
        result,
        executionTime: Date.now() - automation.executedAt
      });

      // Update metrics
      this.metrics.automationSuccess++;

      return result;
    } catch (error) {
      automation.status = 'failed';
      automation.error = error.message;
      
      console.error(`❌ Automation execution failed: ${automation.id}`, error);
      this.metrics.errors++;
      
      throw error;
    } finally {
      // Clean up completed automation
      setTimeout(() => {
        this.activeAutomations.delete(automation.id);
      }, 300000); // Keep for 5 minutes for debugging
    }
  }

  async executeAction(action, automation) {
    const actionHandlers = {
      send_recovery_email: () => this.sendRecoveryEmail(automation),
      send_consultation_offer: () => this.sendConsultationOffer(automation),
      send_reactivation_campaign: () => this.sendReactivationCampaign(automation),
      send_discount_offer: () => this.sendDiscountOffer(automation),
      send_feedback_request: () => this.sendFeedbackRequest(automation),
      show_chat_prompt: () => this.showChatPrompt(automation)
    };

    const handler = actionHandlers[action];
    if (!handler) {
      throw new Error(`Unknown action: ${action}`);
    }

    return await handler();
  }

  async sendRecoveryEmail(automation) {
    // Email recovery implementation
    return {
      type: 'email',
      template: 'booking_recovery',
      personalization: automation.context.personalizationData,
      sent: true,
      timestamp: Date.now()
    };
  }

  async sendConsultationOffer(automation) {
    // Consultation offer implementation
    return {
      type: 'email',
      template: 'consultation_offer',
      personalization: automation.context.personalizationData,
      sent: true,
      timestamp: Date.now()
    };
  }

  async sendReactivationCampaign(automation) {
    // Reactivation campaign implementation
    return {
      type: 'multi_channel',
      channels: ['email', 'push'],
      template: 'reactivation',
      personalization: automation.context.personalizationData,
      sent: true,
      timestamp: Date.now()
    };
  }

  async sendDiscountOffer(automation) {
    // Discount offer implementation
    return {
      type: 'email',
      template: 'discount_offer',
      discountCode: this.generateDiscountCode(),
      personalization: automation.context.personalizationData,
      sent: true,
      timestamp: Date.now()
    };
  }

  async sendFeedbackRequest(automation) {
    // Feedback request implementation
    return {
      type: 'email',
      template: 'feedback_request',
      personalization: automation.context.personalizationData,
      sent: true,
      timestamp: Date.now()
    };
  }

  async showChatPrompt(automation) {
    // Chat prompt implementation
    return {
      type: 'in_app',
      component: 'chat_prompt',
      personalization: automation.context.personalizationData,
      displayed: true,
      timestamp: Date.now()
    };
  }

  generateDiscountCode() {
    return 'REVIVA' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  updateMetrics(responseTime, success) {
    this.metrics.triggersProcessed++;
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.triggersProcessed - 1) + responseTime) / 
      this.metrics.triggersProcessed;
    
    if (!success) {
      this.metrics.errors++;
    }
  }

  startEventProcessor() {
    // Process event queue every 100ms to maintain responsiveness
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 100);
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeAutomations: this.activeAutomations.size,
      queueLength: this.eventQueue.length,
      triggersConfigured: this.triggers.size,
      isProcessing: this.isProcessing
    };
  }

  async getActiveAutomations() {
    return Array.from(this.activeAutomations.values());
  }

  async cancelAutomation(automationId) {
    const automation = this.activeAutomations.get(automationId);
    if (automation) {
      automation.status = 'cancelled';
      this.activeAutomations.delete(automationId);
      return true;
    }
    return false;
  }
}

module.exports = MarketingAutomation;