const EventEmitter = require('events');

class NotificationService extends EventEmitter {
  constructor(io, options = {}) {
    super();
    this.io = io;
    this.options = {
      enablePersistence: true,
      maxNotificationsPerUser: 100,
      notificationTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
      enableRealTimeDelivery: true,
      enableEmailFallback: true,
      enableSMSFallback: true,
      rateLimiting: {
        enabled: true,
        maxPerMinute: 10,
        maxPerHour: 100
      },
      ...options
    };

    this.notifications = new Map(); // In-memory storage (use database in production)
    this.userSockets = new Map(); // Track user socket connections
    this.rateLimiter = new Map(); // Rate limiting per user
    this.subscriptions = new Map(); // User notification preferences
    
    // Metrics
    this.metrics = {
      notificationsSent: 0,
      realTimeDelivered: 0,
      emailFallbacks: 0,
      smsFallbacks: 0,
      totalUsers: 0,
      activeConnections: 0,
      errors: []
    };

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New WebSocket connection: ${socket.id}`);
      this.metrics.activeConnections++;

      // Handle user authentication and registration
      socket.on('authenticate', async (data) => {
        try {
          const { userId, token, userType = 'customer' } = data;
          
          // Verify token (implement your JWT verification here)
          const isValid = await this.verifyUserToken(userId, token);
          
          if (isValid) {
            socket.userId = userId;
            socket.userType = userType;
            
            // Join user-specific room
            socket.join(`user:${userId}`);
            
            // Join user type room (for broadcast messages)
            socket.join(`userType:${userType}`);
            
            // Track user socket
            if (!this.userSockets.has(userId)) {
              this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(socket.id);
            
            // Send authentication success
            socket.emit('authenticated', {
              success: true,
              userId,
              userType,
              timestamp: Date.now()
            });
            
            // Send pending notifications
            await this.sendPendingNotifications(userId, socket);
            
            console.log(`✅ User authenticated: ${userId} (${userType})`);
          } else {
            socket.emit('authentication_error', {
              error: 'Invalid credentials'
            });
            socket.disconnect();
          }
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('authentication_error', {
            error: 'Authentication failed'
          });
          socket.disconnect();
        }
      });

      // Handle notification preferences
      socket.on('update_preferences', async (preferences) => {
        if (socket.userId) {
          await this.updateUserPreferences(socket.userId, preferences);
          socket.emit('preferences_updated', {
            success: true,
            preferences,
            timestamp: Date.now()
          });
        }
      });

      // Handle notification acknowledgment
      socket.on('acknowledge_notification', async (notificationId) => {
        if (socket.userId) {
          await this.acknowledgeNotification(socket.userId, notificationId);
        }
      });

      // Handle marking notifications as read
      socket.on('mark_read', async (notificationIds) => {
        if (socket.userId) {
          await this.markNotificationsAsRead(socket.userId, notificationIds);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 WebSocket disconnected: ${socket.id}`);
        this.metrics.activeConnections--;
        
        if (socket.userId) {
          const userSockets = this.userSockets.get(socket.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  async verifyUserToken(userId, token) {
    // Implement JWT verification here
    // For now, return true (replace with actual verification)
    try {
      // const jwt = require('jsonwebtoken');
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // return decoded.userId === userId;
      return true; // Placeholder
    } catch (error) {
      return false;
    }
  }

  async sendNotification(notificationData) {
    try {
      const notification = {
        id: notificationData.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: notificationData.userId,
        type: notificationData.type || 'info',
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        priority: notificationData.priority || 'normal',
        channels: notificationData.channels || ['websocket'],
        read: false,
        acknowledged: false,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.options.notificationTTL
      };

      // Check rate limiting
      if (!this.checkRateLimit(notification.userId)) {
        throw new Error('Rate limit exceeded for user');
      }

      // Store notification
      if (this.options.enablePersistence) {
        await this.storeNotification(notification);
      }

      // Try real-time delivery first
      let delivered = false;
      if (this.options.enableRealTimeDelivery && notification.channels.includes('websocket')) {
        delivered = await this.deliverRealTime(notification);
      }

      // Fallback to other channels if real-time delivery failed
      if (!delivered) {
        await this.handleFallbackDelivery(notification);
      }

      // Update metrics
      this.metrics.notificationsSent++;
      if (delivered) {
        this.metrics.realTimeDelivered++;
      }

      // Emit notification sent event
      this.emit('notificationSent', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        delivered,
        timestamp: Date.now()
      });

      console.log(`📱 Notification sent: ${notification.id} to user ${notification.userId}`);

      return {
        success: true,
        notificationId: notification.id,
        delivered,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Notification send failed:', error);
      this.metrics.errors.push({
        timestamp: Date.now(),
        error: error.message,
        userId: notificationData.userId
      });
      throw error;
    }
  }

  async deliverRealTime(notification) {
    const userSockets = this.userSockets.get(notification.userId);
    
    if (!userSockets || userSockets.size === 0) {
      console.log(`📱 User ${notification.userId} not connected, will use fallback`);
      return false;
    }

    // Send to all user's connected devices
    this.io.to(`user:${notification.userId}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      timestamp: notification.createdAt
    });

    console.log(`📱 Real-time notification delivered to ${userSockets.size} device(s) for user ${notification.userId}`);
    return true;
  }

  async handleFallbackDelivery(notification) {
    const fallbackChannels = notification.channels.filter(channel => channel !== 'websocket');
    
    for (const channel of fallbackChannels) {
      try {
        switch (channel) {
          case 'email':
            if (this.options.enableEmailFallback) {
              await this.sendEmailNotification(notification);
              this.metrics.emailFallbacks++;
            }
            break;
          case 'sms':
            if (this.options.enableSMSFallback) {
              await this.sendSMSNotification(notification);
              this.metrics.smsFallbacks++;
            }
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
        }
      } catch (error) {
        console.error(`❌ Fallback delivery failed for channel ${channel}:`, error);
      }
    }
  }

  async sendEmailNotification(notification) {
    // Emit event for email service to handle
    this.emit('emailNotificationRequested', {
      userId: notification.userId,
      subject: notification.title,
      message: notification.message,
      data: notification.data,
      notificationId: notification.id
    });
  }

  async sendSMSNotification(notification) {
    // Emit event for SMS service to handle
    this.emit('smsNotificationRequested', {
      userId: notification.userId,
      message: `${notification.title}: ${notification.message}`,
      data: notification.data,
      notificationId: notification.id
    });
  }

  async sendPushNotification(notification) {
    // Implement push notification logic here
    console.log(`📱 Push notification would be sent to user ${notification.userId}`);
  }

  checkRateLimit(userId) {
    if (!this.options.rateLimiting.enabled) {
      return true;
    }

    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    if (!this.rateLimiter.has(userId)) {
      this.rateLimiter.set(userId, {
        minuteCount: 0,
        hourCount: 0,
        lastMinute: now,
        lastHour: now
      });
    }

    const limits = this.rateLimiter.get(userId);

    // Reset counters if time has passed
    if (now - limits.lastMinute >= oneMinute) {
      limits.minuteCount = 0;
      limits.lastMinute = now;
    }

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

  async storeNotification(notification) {
    // Store in memory map (use database in production)
    if (!this.notifications.has(notification.userId)) {
      this.notifications.set(notification.userId, []);
    }

    const userNotifications = this.notifications.get(notification.userId);
    userNotifications.push(notification);

    // Keep only the latest notifications
    if (userNotifications.length > this.options.maxNotificationsPerUser) {
      userNotifications.splice(0, userNotifications.length - this.options.maxNotificationsPerUser);
    }

    // Clean up expired notifications
    const now = Date.now();
    const validNotifications = userNotifications.filter(n => n.expiresAt > now);
    this.notifications.set(notification.userId, validNotifications);
  }

  async sendPendingNotifications(userId, socket) {
    if (!this.notifications.has(userId)) {
      return;
    }

    const userNotifications = this.notifications.get(userId);
    const unreadNotifications = userNotifications.filter(n => !n.read);

    if (unreadNotifications.length > 0) {
      socket.emit('pending_notifications', {
        notifications: unreadNotifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data,
          priority: n.priority,
          timestamp: n.createdAt
        })),
        count: unreadNotifications.length
      });

      console.log(`📱 Sent ${unreadNotifications.length} pending notifications to user ${userId}`);
    }
  }

  async acknowledgeNotification(userId, notificationId) {
    if (this.notifications.has(userId)) {
      const userNotifications = this.notifications.get(userId);
      const notification = userNotifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.acknowledged = true;
        console.log(`✅ Notification acknowledged: ${notificationId} by user ${userId}`);
      }
    }
  }

  async markNotificationsAsRead(userId, notificationIds) {
    if (this.notifications.has(userId)) {
      const userNotifications = this.notifications.get(userId);
      
      notificationIds.forEach(id => {
        const notification = userNotifications.find(n => n.id === id);
        if (notification) {
          notification.read = true;
        }
      });

      console.log(`✅ Marked ${notificationIds.length} notifications as read for user ${userId}`);
    }
  }

  async updateUserPreferences(userId, preferences) {
    this.subscriptions.set(userId, {
      ...preferences,
      updatedAt: Date.now()
    });

    console.log(`⚙️ Updated notification preferences for user ${userId}`);
  }

  // Broadcast methods for admin notifications
  async broadcastToUserType(userType, notification) {
    this.io.to(`userType:${userType}`).emit('broadcast_notification', {
      id: `broadcast_${Date.now()}`,
      type: notification.type || 'announcement',
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      timestamp: Date.now()
    });

    console.log(`📢 Broadcast sent to all ${userType} users`);
  }

  async broadcastToAll(notification) {
    this.io.emit('broadcast_notification', {
      id: `broadcast_all_${Date.now()}`,
      type: notification.type || 'announcement',
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      timestamp: Date.now()
    });

    console.log(`📢 Broadcast sent to all connected users`);
  }

  // Business-specific notification methods
  async sendBookingConfirmation(userId, bookingData) {
    return await this.sendNotification({
      userId,
      type: 'booking_confirmation',
      title: 'Booking Confirmed',
      message: `Your repair booking has been confirmed for ${bookingData.appointmentDate}`,
      data: bookingData,
      priority: 'high',
      channels: ['websocket', 'email', 'sms']
    });
  }

  async sendRepairUpdate(userId, repairData) {
    return await this.sendNotification({
      userId,
      type: 'repair_update',
      title: 'Repair Status Update',
      message: `Your ${repairData.device} repair status: ${repairData.status}`,
      data: repairData,
      priority: 'normal',
      channels: ['websocket', 'email']
    });
  }

  async sendReadyForPickup(userId, repairData) {
    return await this.sendNotification({
      userId,
      type: 'ready_for_pickup',
      title: 'Device Ready for Pickup',
      message: `Your ${repairData.device} is ready for pickup!`,
      data: repairData,
      priority: 'high',
      channels: ['websocket', 'email', 'sms']
    });
  }

  async sendPaymentReminder(userId, paymentData) {
    return await this.sendNotification({
      userId,
      type: 'payment_reminder',
      title: 'Payment Required',
      message: `Payment of £${paymentData.amount} is required for your repair`,
      data: paymentData,
      priority: 'high',
      channels: ['websocket', 'email']
    });
  }

  // Analytics and monitoring
  getMetrics() {
    return {
      ...this.metrics,
      connectedUsers: this.userSockets.size,
      totalStoredNotifications: Array.from(this.notifications.values()).reduce((sum, notifs) => sum + notifs.length, 0),
      subscriptionsCount: this.subscriptions.size,
      rateLimiterEntries: this.rateLimiter.size
    };
  }

  getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }

  getUserNotifications(userId, includeRead = false) {
    if (!this.notifications.has(userId)) {
      return [];
    }

    const notifications = this.notifications.get(userId);
    return includeRead ? notifications : notifications.filter(n => !n.read);
  }

  // Maintenance methods
  cleanupExpiredNotifications() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, notifications] of this.notifications.entries()) {
      const validNotifications = notifications.filter(n => n.expiresAt > now);
      
      if (validNotifications.length !== notifications.length) {
        cleanedCount += notifications.length - validNotifications.length;
        
        if (validNotifications.length === 0) {
          this.notifications.delete(userId);
        } else {
          this.notifications.set(userId, validNotifications);
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired notifications`);
    }

    return cleanedCount;
  }

  cleanupRateLimiter() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [userId, limits] of this.rateLimiter.entries()) {
      if (now - limits.lastHour > oneHour) {
        this.rateLimiter.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} rate limiter entries`);
    }

    return cleanedCount;
  }

  // Health check
  healthCheck() {
    return {
      status: 'healthy',
      metrics: this.getMetrics(),
      connectedUsers: this.getConnectedUsers().length,
      timestamp: Date.now()
    };
  }
}

module.exports = NotificationService;