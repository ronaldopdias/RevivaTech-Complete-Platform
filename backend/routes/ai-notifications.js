/**
 * AI-Powered Real-time Notifications for RevivaTech
 * 
 * WebSocket endpoints for intelligent notification delivery
 * - Real-time diagnostic updates
 * - AI-powered repair progress notifications
 * - Smart customer communication
 * - Automated status updates
 * 
 * Session 5: Backend API Development - Real-time AI notifications
 */

const express = require('express');
const router = express.Router();

// Middleware for JSON parsing
router.use(express.json({ limit: '10mb' }));

/**
 * Send AI Diagnostic Notification
 * Real-time notification when AI completes device analysis
 */
router.post('/ai-diagnostic-complete', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { 
      userId, 
      diagnostic, 
      deviceType, 
      estimatedCost, 
      estimatedTime,
      confidence 
    } = req.body;

    if (!userId || !diagnostic) {
      return res.status(400).json({
        success: false,
        error: 'userId and diagnostic are required'
      });
    }

    console.log('🤖 Sending AI diagnostic completion notification to user:', userId);

    // Create intelligent notification based on diagnostic results
    const notificationData = {
      userId,
      type: 'ai_diagnostic_complete',
      title: '🔍 AI Diagnosis Complete',
      message: `Your ${deviceType} diagnostic is ready! Estimated cost: £${estimatedCost.min}-£${estimatedCost.max}, Time: ${estimatedTime}`,
      data: {
        diagnostic,
        deviceType,
        estimatedCost,
        estimatedTime,
        confidence,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        nextSteps: [
          'Review diagnostic results',
          'Book repair appointment',
          'Get expert consultation'
        ]
      },
      priority: confidence > 80 ? 'high' : 'medium',
      channels: ['websocket', 'push'],
      metadata: {
        category: 'diagnostic',
        source: 'ai_assistant',
        confidence: confidence,
        urgency: diagnostic.urgency || 'medium'
      }
    };

    const result = await notificationService.sendNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'AI diagnostic notification sent successfully'
    });

  } catch (error) {
    console.error('❌ AI diagnostic notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send AI diagnostic notification',
      message: error.message
    });
  }
});

/**
 * Send AI Repair Progress Update
 * Real-time notifications for repair progress with AI insights
 */
router.post('/repair-progress-update', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { 
      userId, 
      repairId, 
      status, 
      progress, 
      estimatedCompletion,
      aiInsights,
      technician 
    } = req.body;

    if (!userId || !repairId || !status) {
      return res.status(400).json({
        success: false,
        error: 'userId, repairId, and status are required'
      });
    }

    console.log('🔧 Sending AI-powered repair progress update to user:', userId);

    // Generate intelligent progress message based on status
    const statusMessages = {
      'received': '📋 Your repair request has been received and is being processed',
      'diagnosed': '🔍 Diagnostic complete - repair plan confirmed',
      'parts_ordered': '📦 Required parts have been ordered',
      'in_progress': '🔧 Repair work is now in progress',
      'testing': '🧪 Quality testing and verification underway',
      'completed': '✅ Repair completed successfully!',
      'ready_for_pickup': '🎉 Device ready for pickup or delivery'
    };

    const message = statusMessages[status] || `Repair status updated: ${status}`;

    const notificationData = {
      userId,
      type: 'repair_progress_update',
      title: `Repair Update - Order #${repairId}`,
      message: message,
      data: {
        repairId,
        status,
        progress: progress || calculateProgressPercentage(status),
        estimatedCompletion,
        aiInsights: aiInsights || generateAIInsights(status, progress),
        technician: technician || 'RevivaTech Team',
        timestamp: new Date().toISOString(),
        nextActions: getNextActions(status)
      },
      priority: status === 'completed' || status === 'ready_for_pickup' ? 'high' : 'medium',
      channels: ['websocket', 'push', 'email'],
      metadata: {
        category: 'repair_progress',
        source: 'ai_workflow',
        repairId,
        status,
        automated: true
      }
    };

    const result = await notificationService.sendNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'Repair progress notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Repair progress notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send repair progress notification',
      message: error.message
    });
  }
});

/**
 * Send AI Smart Recommendation
 * Proactive notifications with AI-generated recommendations
 */
router.post('/smart-recommendation', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { 
      userId, 
      recommendationType, 
      recommendation, 
      reasoning,
      actionItems,
      confidence
    } = req.body;

    if (!userId || !recommendationType || !recommendation) {
      return res.status(400).json({
        success: false,
        error: 'userId, recommendationType, and recommendation are required'
      });
    }

    console.log('💡 Sending AI smart recommendation to user:', userId);

    // Generate notification based on recommendation type
    const recommendationTitles = {
      'maintenance': '🛠️ Preventive Maintenance Recommended',
      'upgrade': '⬆️ Device Upgrade Suggestion',
      'warranty': '🛡️ Warranty Extension Available',
      'security': '🔒 Security Update Recommendation',
      'performance': '⚡ Performance Optimization Available',
      'cost_saving': '💰 Cost Saving Opportunity',
      'appointment': '📅 Optimal Appointment Time Available'
    };

    const title = recommendationTitles[recommendationType] || '💡 AI Recommendation';

    const notificationData = {
      userId,
      type: 'ai_smart_recommendation',
      title,
      message: recommendation,
      data: {
        recommendationType,
        recommendation,
        reasoning: reasoning || 'Based on AI analysis of your device usage patterns',
        actionItems: actionItems || ['Review recommendation', 'Contact support', 'Schedule appointment'],
        confidence: confidence || 85,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      },
      priority: recommendationType === 'security' ? 'high' : 'medium',
      channels: ['websocket', 'push'],
      metadata: {
        category: 'recommendation',
        source: 'ai_advisor',
        type: recommendationType,
        confidence: confidence || 85
      }
    };

    const result = await notificationService.sendNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'AI recommendation notification sent successfully'
    });

  } catch (error) {
    console.error('❌ AI recommendation notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send AI recommendation notification',
      message: error.message
    });
  }
});

/**
 * Send AI Cost Alert
 * Smart notifications about cost changes or optimization opportunities
 */
router.post('/cost-alert', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { 
      userId, 
      alertType, 
      originalCost, 
      newCost, 
      savings,
      reason,
      repairId
    } = req.body;

    if (!userId || !alertType) {
      return res.status(400).json({
        success: false,
        error: 'userId and alertType are required'
      });
    }

    console.log('💰 Sending AI cost alert to user:', userId);

    // Generate cost alert message
    let message = '';
    let title = '';
    
    switch (alertType) {
      case 'cost_reduction':
        title = '💰 Cost Reduction Available';
        message = `Great news! We found a way to reduce your repair cost from £${originalCost} to £${newCost} (Save £${savings})`;
        break;
      case 'price_increase':
        title = '📈 Cost Adjustment Notice';
        message = `Your repair cost has been updated from £${originalCost} to £${newCost} due to ${reason}`;
        break;
      case 'alternative_option':
        title = '🔄 Alternative Repair Option';
        message = `AI analysis suggests an alternative repair approach that could save you £${savings}`;
        break;
      case 'warranty_coverage':
        title = '🛡️ Warranty Coverage Detected';
        message = `Good news! This repair may be covered under warranty, potentially saving you £${originalCost}`;
        break;
      default:
        title = '💰 Cost Update';
        message = `Cost update for your repair: £${newCost}`;
    }

    const notificationData = {
      userId,
      type: 'ai_cost_alert',
      title,
      message,
      data: {
        alertType,
        originalCost,
        newCost,
        savings: savings || (originalCost - newCost),
        reason: reason || 'AI cost optimization',
        repairId,
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        actionRequired: alertType === 'price_increase',
        savingsOpportunity: alertType === 'cost_reduction' || alertType === 'alternative_option'
      },
      priority: savings > 50 || alertType === 'warranty_coverage' ? 'high' : 'medium',
      channels: ['websocket', 'push', 'email'],
      metadata: {
        category: 'cost_alert',
        source: 'ai_pricing',
        type: alertType,
        savings: savings || 0
      }
    };

    const result = await notificationService.sendNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'AI cost alert notification sent successfully'
    });

  } catch (error) {
    console.error('❌ AI cost alert notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send AI cost alert notification',
      message: error.message
    });
  }
});

/**
 * Broadcast AI System Status
 * System-wide notifications about AI service status
 */
router.post('/system-status', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { 
      status, 
      message, 
      affectedServices,
      estimatedResolution,
      severity
    } = req.body;

    if (!status || !message) {
      return res.status(400).json({
        success: false,
        error: 'status and message are required'
      });
    }

    console.log('🚨 Broadcasting AI system status update:', status);

    const statusIcons = {
      'operational': '✅',
      'degraded': '⚠️',
      'maintenance': '🔧',
      'outage': '🚨',
      'recovering': '🔄'
    };

    const icon = statusIcons[status] || '📢';

    const notificationData = {
      type: 'ai_system_status',
      title: `${icon} AI System Status Update`,
      message: message,
      data: {
        status,
        affectedServices: affectedServices || ['ai_diagnostics', 'cost_estimation'],
        estimatedResolution,
        severity: severity || 'medium',
        timestamp: new Date().toISOString(),
        systemMessage: true
      },
      priority: severity === 'critical' ? 'high' : 'medium',
      channels: ['websocket', 'push'],
      metadata: {
        category: 'system_status',
        source: 'ai_monitor',
        status,
        broadcast: true
      }
    };

    // Broadcast to all connected users
    const result = await notificationService.broadcastNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'AI system status notification broadcasted successfully'
    });

  } catch (error) {
    console.error('❌ AI system status notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send AI system status notification',
      message: error.message
    });
  }
});

/**
 * Get User's AI Notification History
 * Retrieve AI-generated notifications for a specific user
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId } = req.params;
    const { 
      type, 
      limit = 50, 
      offset = 0, 
      aiOnly = true 
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    console.log('📋 Fetching AI notification history for user:', userId);

    // Get notification history with AI filtering
    const notifications = await notificationService.getUserNotifications(userId, {
      type,
      limit: parseInt(limit),
      offset: parseInt(offset),
      filter: aiOnly === 'true' ? 'ai_generated' : null
    });

    res.json({
      success: true,
      data: {
        notifications,
        totalCount: notifications.length,
        hasMore: notifications.length === parseInt(limit),
        filters: { type, aiOnly }
      },
      message: 'AI notification history retrieved successfully'
    });

  } catch (error) {
    console.error('❌ AI notification history retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI notification history',
      message: error.message
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate progress percentage based on repair status
 */
function calculateProgressPercentage(status) {
  const progressMap = {
    'received': 10,
    'diagnosed': 25,
    'parts_ordered': 40,
    'in_progress': 60,
    'testing': 80,
    'completed': 95,
    'ready_for_pickup': 100
  };
  
  return progressMap[status] || 0;
}

/**
 * Generate AI insights based on repair status
 */
function generateAIInsights(status, progress) {
  const insights = {
    'received': 'Your repair request is being processed by our AI triage system for optimal routing',
    'diagnosed': 'AI analysis confirms the repair approach and estimated timeline',
    'parts_ordered': 'Supply chain optimization ensuring fastest delivery of quality parts',
    'in_progress': 'Real-time monitoring shows repair progressing as expected',
    'testing': 'AI-powered quality assurance ensuring optimal performance',
    'completed': 'All quality checks passed - device restored to optimal condition',
    'ready_for_pickup': 'Device ready with full diagnostic report and performance metrics'
  };
  
  return insights[status] || 'AI monitoring active for optimal service delivery';
}

/**
 * Get next actions based on repair status
 */
function getNextActions(status) {
  const actions = {
    'received': ['Track progress online', 'Backup important data', 'Prepare device for drop-off'],
    'diagnosed': ['Review repair plan', 'Approve cost estimate', 'Confirm timeline'],
    'parts_ordered': ['Wait for parts arrival', 'Check for updates', 'Prepare for repair start'],
    'in_progress': ['Track real-time progress', 'Stay available for contact', 'Prepare pickup plans'],
    'testing': ['Await final quality check', 'Review repair warranty', 'Confirm pickup details'],
    'completed': ['Schedule pickup', 'Review repair report', 'Test device functionality'],
    'ready_for_pickup': ['Collect device', 'Test functionality', 'Provide feedback']
  };
  
  return actions[status] || ['Contact support for updates'];
}

module.exports = router;