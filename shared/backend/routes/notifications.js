const express = require('express');
const router = express.Router();

// This route file handles REST API endpoints for notifications
// The real-time WebSocket functionality is handled by NotificationService

// =========================
// NOTIFICATION ENDPOINTS
// =========================

// Send notification to specific user
router.post('/send', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const notificationData = {
      userId: req.body.userId,
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      data: req.body.data,
      priority: req.body.priority,
      channels: req.body.channels || ['websocket']
    };

    // Validate required fields
    if (!notificationData.userId || !notificationData.title || !notificationData.message) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, and message are required'
      });
    }

    const result = await notificationService.sendNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('❌ Notification send failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to send notification'
    });
  }
});

// Send bulk notifications
router.post('/send-bulk', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'notifications array is required and must not be empty'
      });
    }

    const results = [];
    const errors = [];

    for (const notificationData of notifications) {
      try {
        const result = await notificationService.sendNotification(notificationData);
        results.push(result);
      } catch (error) {
        errors.push({
          notification: notificationData,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Bulk notifications completed: ${results.length} sent, ${errors.length} failed`
    });
  } catch (error) {
    console.error('❌ Bulk notification send failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send bulk notifications'
    });
  }
});

// Broadcast to user type (customers, admins, etc.)
router.post('/broadcast/user-type', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userType, notification } = req.body;

    if (!userType || !notification) {
      return res.status(400).json({
        success: false,
        error: 'userType and notification are required'
      });
    }

    await notificationService.broadcastToUserType(userType, notification);
    
    res.json({
      success: true,
      message: `Broadcast sent to all ${userType} users`
    });
  } catch (error) {
    console.error('❌ Broadcast to user type failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to broadcast to user type'
    });
  }
});

// Broadcast to all users
router.post('/broadcast/all', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { notification } = req.body;

    if (!notification) {
      return res.status(400).json({
        success: false,
        error: 'notification is required'
      });
    }

    await notificationService.broadcastToAll(notification);
    
    res.json({
      success: true,
      message: 'Broadcast sent to all users'
    });
  } catch (error) {
    console.error('❌ Broadcast to all failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to broadcast to all users'
    });
  }
});

// =========================
// BUSINESS NOTIFICATION ENDPOINTS
// =========================

// Send booking confirmation notification
router.post('/booking-confirmation', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId, bookingData } = req.body;

    if (!userId || !bookingData) {
      return res.status(400).json({
        success: false,
        error: 'userId and bookingData are required'
      });
    }

    const result = await notificationService.sendBookingConfirmation(userId, bookingData);
    
    res.json({
      success: true,
      data: result,
      message: 'Booking confirmation notification sent'
    });
  } catch (error) {
    console.error('❌ Booking confirmation notification failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to send booking confirmation notification'
    });
  }
});

// Send repair update notification
router.post('/repair-update', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId, repairData } = req.body;

    if (!userId || !repairData) {
      return res.status(400).json({
        success: false,
        error: 'userId and repairData are required'
      });
    }

    const result = await notificationService.sendRepairUpdate(userId, repairData);
    
    res.json({
      success: true,
      data: result,
      message: 'Repair update notification sent'
    });
  } catch (error) {
    console.error('❌ Repair update notification failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to send repair update notification'
    });
  }
});

// Send ready for pickup notification
router.post('/ready-for-pickup', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId, repairData } = req.body;

    if (!userId || !repairData) {
      return res.status(400).json({
        success: false,
        error: 'userId and repairData are required'
      });
    }

    const result = await notificationService.sendReadyForPickup(userId, repairData);
    
    res.json({
      success: true,
      data: result,
      message: 'Ready for pickup notification sent'
    });
  } catch (error) {
    console.error('❌ Ready for pickup notification failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to send ready for pickup notification'
    });
  }
});

// Send payment reminder notification
router.post('/payment-reminder', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId, paymentData } = req.body;

    if (!userId || !paymentData) {
      return res.status(400).json({
        success: false,
        error: 'userId and paymentData are required'
      });
    }

    const result = await notificationService.sendPaymentReminder(userId, paymentData);
    
    res.json({
      success: true,
      data: result,
      message: 'Payment reminder notification sent'
    });
  } catch (error) {
    console.error('❌ Payment reminder notification failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to send payment reminder notification'
    });
  }
});

// =========================
// USER NOTIFICATION MANAGEMENT
// =========================

// Get user notifications
router.get('/user/:userId', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId } = req.params;
    const includeRead = req.query.includeRead === 'true';

    const notifications = notificationService.getUserNotifications(userId, includeRead);
    
    res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length
      },
      message: 'User notifications retrieved'
    });
  } catch (error) {
    console.error('❌ Get user notifications failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve user notifications'
    });
  }
});

// Mark notifications as read
router.patch('/user/:userId/mark-read', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId } = req.params;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: 'notificationIds array is required'
      });
    }

    await notificationService.markNotificationsAsRead(userId, notificationIds);
    
    res.json({
      success: true,
      message: `Marked ${notificationIds.length} notifications as read`
    });
  } catch (error) {
    console.error('❌ Mark notifications as read failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to mark notifications as read'
    });
  }
});

// Update user notification preferences
router.patch('/user/:userId/preferences', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const { userId } = req.params;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'preferences object is required'
      });
    }

    await notificationService.updateUserPreferences(userId, preferences);
    
    res.json({
      success: true,
      message: 'User notification preferences updated'
    });
  } catch (error) {
    console.error('❌ Update notification preferences failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update notification preferences'
    });
  }
});

// =========================
// MONITORING ENDPOINTS
// =========================

// Get notification metrics
router.get('/metrics', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const metrics = notificationService.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'Notification metrics retrieved'
    });
  } catch (error) {
    console.error('❌ Get notification metrics failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve notification metrics'
    });
  }
});

// Get connected users
router.get('/connected-users', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const connectedUsers = notificationService.getConnectedUsers();
    
    res.json({
      success: true,
      data: {
        users: connectedUsers,
        count: connectedUsers.length
      },
      message: 'Connected users retrieved'
    });
  } catch (error) {
    console.error('❌ Get connected users failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve connected users'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const health = notificationService.healthCheck();
    
    res.json({
      success: true,
      data: health,
      message: 'Notification service health check completed'
    });
  } catch (error) {
    console.error('❌ Notification health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Notification health check failed'
    });
  }
});

// =========================
// MAINTENANCE ENDPOINTS
// =========================

// Cleanup expired notifications
router.post('/maintenance/cleanup-expired', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const cleanedCount = notificationService.cleanupExpiredNotifications();
    
    res.json({
      success: true,
      data: { cleanedCount },
      message: `Cleaned up ${cleanedCount} expired notifications`
    });
  } catch (error) {
    console.error('❌ Notification cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to cleanup expired notifications'
    });
  }
});

// Cleanup rate limiter
router.post('/maintenance/cleanup-rate-limiter', async (req, res) => {
  try {
    const notificationService = req.app.locals.notificationService;
    
    if (!notificationService) {
      return res.status(500).json({
        success: false,
        error: 'Notification service not initialized'
      });
    }

    const cleanedCount = notificationService.cleanupRateLimiter();
    
    res.json({
      success: true,
      data: { cleanedCount },
      message: `Cleaned up ${cleanedCount} rate limiter entries`
    });
  } catch (error) {
    console.error('❌ Rate limiter cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to cleanup rate limiter'
    });
  }
});

module.exports = router;