const express = require('express');
const router = express.Router();

/**
 * Automation Integration Routes
 * Unified API for testing and managing cross-service automation
 * Connects EventProcessor, MarketingAutomation, EmailAutomationService, and NotificationService
 */

// Test integrated automation workflow
router.post('/test-workflow', async (req, res) => {
  try {
    const { eventType, eventData, options = {} } = req.body;
    
    // Get services from app.locals
    const eventProcessor = req.app.locals.eventProcessor;
    const marketingAutomation = req.app.locals.marketingAutomation;
    const emailAutomation = req.app.locals.emailAutomationService;
    const notificationService = req.app.locals.notificationService;
    
    if (!eventProcessor) {
      return res.status(503).json({
        success: false,
        error: 'EventProcessor not available',
        message: 'Automation services not properly initialized'
      });
    }
    
    // Create test event
    const testEvent = {
      eventType: eventType || 'booking_abandoned',
      timestamp: Date.now(),
      sessionId: `test_${Date.now()}`,
      userId: eventData?.userId || 'test_user_123',
      email: eventData?.email || 'test@revivatech.co.uk',
      data: {
        booking: {
          id: 'booking_123',
          status: 'abandoned',
          stage: 3,
          deviceType: 'iPhone 12',
          estimatedPrice: 89.99
        },
        user: {
          name: 'Test User',
          email: eventData?.email || 'test@revivatech.co.uk',
          preferences: {
            notifications: true,
            marketing: true
          }
        },
        ...eventData
      },
      ...options
    };
    
    console.log('🧪 Testing integrated automation workflow:', testEvent.eventType);
    
    // Process through EventProcessor (triggers all connected services)
    const processingResult = await eventProcessor.processEvent(testEvent, { immediate: true });
    
    // Get service metrics
    const metrics = {
      eventProcessor: eventProcessor.getMetrics(),
      marketing: marketingAutomation?.getMetrics() || null,
      emailAutomation: emailAutomation?.getMetrics() || null,
      notifications: notificationService?.getMetrics?.() || null
    };
    
    res.json({
      success: true,
      data: {
        processingResult,
        testEvent,
        metrics,
        serviceStatus: {
          eventProcessor: !!eventProcessor,
          marketingAutomation: !!marketingAutomation,
          emailAutomation: !!emailAutomation,
          notificationService: !!notificationService
        }
      },
      message: 'Integrated automation workflow test completed'
    });
    
  } catch (error) {
    console.error('❌ Automation workflow test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Automation workflow test failed'
    });
  }
});

// Trigger specific automation service
router.post('/trigger/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { eventType, eventData, context = {} } = req.body;
    
    let result;
    let serviceName;
    
    switch (service) {
      case 'marketing':
        const marketingService = req.app.locals.marketingAutomation;
        if (!marketingService) {
          throw new Error('MarketingAutomation service not available');
        }
        result = await marketingService.processEvent({ 
          type: eventType, 
          ...eventData 
        });
        serviceName = 'MarketingAutomation';
        break;
        
      case 'email':
        const emailService = req.app.locals.emailAutomationService;
        if (!emailService) {
          throw new Error('EmailAutomationService not available');
        }
        result = await emailService.triggerWorkflow(eventType, eventData, context);
        serviceName = 'EmailAutomationService';
        break;
        
      case 'notification':
        const notificationService = req.app.locals.notificationService;
        if (!notificationService) {
          throw new Error('NotificationService not available');
        }
        
        // Map to business methods
        const methodMap = {
          'booking_confirmation': 'sendBookingConfirmation',
          'repair_update': 'sendRepairUpdate',
          'payment_confirmation': 'sendPaymentConfirmation',
          'appointment_reminder': 'sendAppointmentReminder'
        };
        
        const method = methodMap[eventType];
        if (method && notificationService[method]) {
          // NotificationService methods expect (userId, data) format
          const userId = eventData.userId || eventData.customer?.id || 'test_user';
          result = await notificationService[method](userId, eventData);
        } else {
          throw new Error(`Unknown notification type: ${eventType}`);
        }
        serviceName = 'NotificationService';
        break;
        
      case 'event-processor':
        const eventProcessor = req.app.locals.eventProcessor;
        if (!eventProcessor) {
          throw new Error('EventProcessor not available');
        }
        result = await eventProcessor.processEvent({
          eventType,
          timestamp: Date.now(),
          sessionId: `direct_${Date.now()}`,
          data: eventData
        });
        serviceName = 'EventProcessor';
        break;
        
      default:
        throw new Error(`Unknown service: ${service}`);
    }
    
    res.json({
      success: true,
      data: result,
      service: serviceName,
      message: `${serviceName} triggered successfully`
    });
    
  } catch (error) {
    console.error(`❌ Service ${req.params.service} trigger failed:`, error);
    res.status(400).json({
      success: false,
      error: error.message,
      service: req.params.service,
      message: 'Service trigger failed'
    });
  }
});

// Get automation system health
router.get('/health', async (req, res) => {
  try {
    const services = {
      eventProcessor: req.app.locals.eventProcessor,
      marketingAutomation: req.app.locals.marketingAutomation,
      emailAutomationService: req.app.locals.emailAutomationService,
      notificationService: req.app.locals.notificationService,
      smsService: req.app.locals.smsService
    };
    
    const health = {};
    const metrics = {};
    
    // Check each service
    for (const [name, service] of Object.entries(services)) {
      if (service) {
        health[name] = {
          available: true,
          initialized: true
        };
        
        // Get metrics if available
        if (service.getMetrics) {
          metrics[name] = service.getMetrics();
        } else if (service.getHealth) {
          health[name].health = await service.getHealth();
        }
      } else {
        health[name] = {
          available: false,
          initialized: false
        };
      }
    }
    
    // Overall system health
    const availableServices = Object.values(health).filter(s => s.available).length;
    const totalServices = Object.keys(health).length;
    const healthPercentage = (availableServices / totalServices) * 100;
    
    const overallStatus = healthPercentage >= 80 ? 'healthy' : 
                         healthPercentage >= 50 ? 'degraded' : 'unhealthy';
    
    res.json({
      success: true,
      data: {
        overall: {
          status: overallStatus,
          availableServices,
          totalServices,
          healthPercentage: Math.round(healthPercentage)
        },
        services: health,
        metrics,
        integrationStatus: {
          crossServiceCommunication: availableServices >= 3,
          eventProcessingPipeline: !!services.eventProcessor,
          automationWorkflows: !!(services.emailAutomationService && services.marketingAutomation),
          realtimeNotifications: !!services.notificationService
        }
      },
      message: `Automation system health: ${overallStatus}`
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Health check failed'
    });
  }
});

// Get comprehensive metrics
router.get('/metrics', async (req, res) => {
  try {
    const services = {
      eventProcessor: req.app.locals.eventProcessor,
      marketingAutomation: req.app.locals.marketingAutomation,
      emailAutomationService: req.app.locals.emailAutomationService,
      notificationService: req.app.locals.notificationService
    };
    
    const allMetrics = {};
    
    for (const [name, service] of Object.entries(services)) {
      if (service && service.getMetrics) {
        allMetrics[name] = service.getMetrics();
      }
    }
    
    // Calculate aggregate metrics
    const aggregate = {
      totalEventsProcessed: 0,
      totalWorkflowsTriggered: 0,
      totalNotificationsSent: 0,
      averageProcessingTime: 0,
      errorRate: 0
    };
    
    // Sum metrics across services
    Object.values(allMetrics).forEach(metrics => {
      if (metrics.processed) aggregate.totalEventsProcessed += metrics.processed;
      if (metrics.workflowsTriggered) aggregate.totalWorkflowsTriggered += metrics.workflowsTriggered;
      if (metrics.emailsSent) aggregate.totalNotificationsSent += metrics.emailsSent;
      if (metrics.notificationsSent) aggregate.totalNotificationsSent += metrics.notificationsSent;
    });
    
    res.json({
      success: true,
      data: {
        aggregate,
        byService: allMetrics,
        timestamp: Date.now()
      },
      message: 'Comprehensive automation metrics retrieved'
    });
    
  } catch (error) {
    console.error('❌ Metrics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Metrics retrieval failed'
    });
  }
});

module.exports = router;