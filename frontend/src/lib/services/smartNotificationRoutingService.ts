// Smart Notification Routing Service for RevivaTech
// Handles intelligent notification delivery, channel optimization, and user preference management

import { db } from '@/lib/database/client';
import { NotificationType, NotificationChannel, NotificationStatus } from '@/generated/prisma';
import { pushNotificationService } from './pushNotificationService';
import { notificationAnalyticsService } from './notificationAnalyticsService';

export interface NotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  expiresAt?: Date;
  bookingId?: string;
  channels?: NotificationChannel[];
  requireDelivery?: boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

export interface DeliveryResult {
  success: boolean;
  channels: {
    [key in NotificationChannel]?: {
      attempted: boolean;
      delivered: boolean;
      error?: string;
    };
  };
  notificationId: string;
  deliveryTime: number;
}

export interface ChannelOptimization {
  channel: NotificationChannel;
  score: number;
  reasoning: string;
  estimatedDeliveryTime: number;
  estimatedEngagementRate: number;
}

export interface UserBehaviorProfile {
  userId: string;
  preferredChannels: NotificationChannel[];
  activeHours: {
    start: number; // 0-23
    end: number;   // 0-23
  };
  engagementPatterns: {
    [key in NotificationType]: {
      openRate: number;
      clickRate: number;
      preferredChannel: NotificationChannel;
      avgResponseTime: number;
    };
  };
  devicePreferences: {
    mobile: boolean;
    desktop: boolean;
    tablet: boolean;
  };
  frequencyTolerance: {
    maxPerHour: number;
    maxPerDay: number;
    optimalInterval: number; // minutes
  };
}

export class SmartNotificationRoutingService {
  private static instance: SmartNotificationRoutingService;

  private constructor() {}

  public static getInstance(): SmartNotificationRoutingService {
    if (!SmartNotificationRoutingService.instance) {
      SmartNotificationRoutingService.instance = new SmartNotificationRoutingService();
    }
    return SmartNotificationRoutingService.instance;
  }

  /**
   * Main method to send a notification with intelligent routing
   */
  public async sendNotification(request: NotificationRequest): Promise<DeliveryResult> {
    const startTime = Date.now();
    
    try {
      // Get user behavior profile
      const userProfile = await this.getUserBehaviorProfile(request.userId);
      
      // Determine optimal channels if not specified
      const optimalChannels = request.channels || 
        await this.determineOptimalChannels(request.userId, request.type, request.priority);
      
      // Check if notification should be sent based on user preferences and timing
      const shouldSend = await this.shouldSendNotification(request, userProfile);
      if (!shouldSend) {
        return {
          success: false,
          channels: {},
          notificationId: '',
          deliveryTime: Date.now() - startTime
        };
      }
      
      // Create notification record in database
      const notification = await this.createNotificationRecord(request);
      
      // Attempt delivery through optimal channels
      const deliveryResults = await this.attemptDelivery(notification.id, request, optimalChannels);
      
      // Update notification status based on delivery results
      await this.updateNotificationStatus(notification.id, deliveryResults);
      
      // Track analytics
      await this.trackDeliveryAnalytics(notification.id, request, deliveryResults);
      
      return {
        success: Object.values(deliveryResults).some(result => result.delivered),
        channels: deliveryResults,
        notificationId: notification.id,
        deliveryTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Failed to send notification:', error);
      return {
        success: false,
        channels: {},
        notificationId: '',
        deliveryTime: Date.now() - startTime
      };
    }
  }

  /**
   * Determine optimal channels for a notification based on user behavior and type
   */
  public async determineOptimalChannels(
    userId: string,
    type: NotificationType,
    priority: string = 'normal'
  ): Promise<NotificationChannel[]> {
    try {
      const userProfile = await this.getUserBehaviorProfile(userId);
      const channelOptimizations = await this.optimizeChannelSelection(userId, type, priority);
      
      // Sort channels by optimization score
      const sortedChannels = channelOptimizations
        .sort((a, b) => b.score - a.score)
        .map(opt => opt.channel);
      
      // For urgent notifications, use all available channels
      if (priority === 'urgent') {
        return [
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
          NotificationChannel.WEBSOCKET
        ];
      }
      
      // For normal priority, use top 2 channels
      if (priority === 'high') {
        return sortedChannels.slice(0, 2);
      }
      
      // For low priority, use the best channel
      return sortedChannels.slice(0, 1);
      
    } catch (error) {
      console.error('Failed to determine optimal channels:', error);
      // Fallback to push notifications
      return [NotificationChannel.PUSH];
    }
  }

  /**
   * Optimize channel selection based on user behavior and historical performance
   */
  public async optimizeChannelSelection(
    userId: string,
    type: NotificationType,
    priority: string = 'normal'
  ): Promise<ChannelOptimization[]> {
    try {
      const userProfile = await this.getUserBehaviorProfile(userId);
      const channelPerformance = await notificationAnalyticsService.getNotificationAnalytics({
        userId,
        type
      });
      
      const optimizations: ChannelOptimization[] = [];
      
      // Evaluate each channel
      for (const channel of Object.values(NotificationChannel)) {
        const performance = channelPerformance.channelPerformance[channel];
        const userEngagement = userProfile.engagementPatterns[type];
        
        let score = 0;
        let reasoning = '';
        
        // Base score from delivery rate
        score += performance.deliveryRate * 0.3;
        
        // Add engagement rate
        score += performance.engagementRate * 0.4;
        
        // Add user preference bonus
        if (userProfile.preferredChannels.includes(channel)) {
          score += 20;
          reasoning += 'User preference. ';
        }
        
        // Time-based optimization
        if (this.isOptimalTimeForChannel(channel, userProfile)) {
          score += 15;
          reasoning += 'Optimal timing. ';
        }
        
        // Channel-specific optimizations
        switch (channel) {
          case NotificationChannel.PUSH:
            // Push notifications work best for immediate actions
            if (priority === 'urgent' || priority === 'high') {
              score += 10;
              reasoning += 'Urgent priority. ';
            }
            break;
            
          case NotificationChannel.EMAIL:
            // Email works well for detailed notifications
            if (type === NotificationType.BOOKING_CONFIRMATION || 
                type === NotificationType.COMPLETION_NOTICE) {
              score += 10;
              reasoning += 'Detailed content. ';
            }
            break;
            
          case NotificationChannel.SMS:
            // SMS for critical, time-sensitive notifications
            if (priority === 'urgent' && 
                (type === NotificationType.PAYMENT_REQUEST || 
                 type === NotificationType.SYSTEM_ALERT)) {
              score += 15;
              reasoning += 'Critical urgency. ';
            }
            break;
            
          case NotificationChannel.WEBSOCKET:
            // WebSocket for real-time updates
            if (type === NotificationType.STATUS_UPDATE) {
              score += 10;
              reasoning += 'Real-time update. ';
            }
            break;
        }
        
        optimizations.push({
          channel,
          score,
          reasoning: reasoning.trim(),
          estimatedDeliveryTime: this.estimateDeliveryTime(channel),
          estimatedEngagementRate: performance.engagementRate
        });
      }
      
      return optimizations;
      
    } catch (error) {
      console.error('Failed to optimize channel selection:', error);
      return [];
    }
  }

  /**
   * Get or create user behavior profile
   */
  public async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    try {
      // In a real implementation, this would be stored in the database
      // For now, we'll generate a profile based on user's notification history
      
      const userStats = await notificationAnalyticsService.getUserNotificationStats(userId);
      
      const defaultProfile: UserBehaviorProfile = {
        userId,
        preferredChannels: [userStats.preferredChannel],
        activeHours: {
          start: 8,
          end: 22
        },
        engagementPatterns: {
          [NotificationType.BOOKING_CONFIRMATION]: {
            openRate: 85,
            clickRate: 40,
            preferredChannel: NotificationChannel.EMAIL,
            avgResponseTime: 300 // 5 minutes
          },
          [NotificationType.STATUS_UPDATE]: {
            openRate: 70,
            clickRate: 25,
            preferredChannel: NotificationChannel.PUSH,
            avgResponseTime: 600 // 10 minutes
          },
          [NotificationType.PAYMENT_REQUEST]: {
            openRate: 95,
            clickRate: 80,
            preferredChannel: NotificationChannel.SMS,
            avgResponseTime: 120 // 2 minutes
          },
          [NotificationType.COMPLETION_NOTICE]: {
            openRate: 90,
            clickRate: 60,
            preferredChannel: NotificationChannel.EMAIL,
            avgResponseTime: 1800 // 30 minutes
          },
          [NotificationType.REMINDER]: {
            openRate: 65,
            clickRate: 30,
            preferredChannel: NotificationChannel.PUSH,
            avgResponseTime: 900 // 15 minutes
          },
          [NotificationType.PROMOTIONAL]: {
            openRate: 35,
            clickRate: 10,
            preferredChannel: NotificationChannel.EMAIL,
            avgResponseTime: 3600 // 1 hour
          },
          [NotificationType.SYSTEM_ALERT]: {
            openRate: 100,
            clickRate: 90,
            preferredChannel: NotificationChannel.PUSH,
            avgResponseTime: 60 // 1 minute
          }
        },
        devicePreferences: {
          mobile: true,
          desktop: true,
          tablet: false
        },
        frequencyTolerance: {
          maxPerHour: 5,
          maxPerDay: 20,
          optimalInterval: 30 // 30 minutes
        }
      };
      
      return defaultProfile;
      
    } catch (error) {
      console.error('Failed to get user behavior profile:', error);
      // Return minimal default profile
      return {
        userId,
        preferredChannels: [NotificationChannel.PUSH],
        activeHours: { start: 8, end: 22 },
        engagementPatterns: {} as any,
        devicePreferences: { mobile: true, desktop: true, tablet: false },
        frequencyTolerance: { maxPerHour: 5, maxPerDay: 20, optimalInterval: 30 }
      };
    }
  }

  /**
   * Check if a notification should be sent based on user preferences and timing
   */
  private async shouldSendNotification(
    request: NotificationRequest,
    userProfile: UserBehaviorProfile
  ): Promise<boolean> {
    try {
      // Check if user has notifications enabled for this type
      const preferences = await pushNotificationService.getUserNotificationPreferences(request.userId);
      
      if (!preferences.enabled || !preferences.types[request.type]) {
        return false;
      }
      
      // Check quiet hours
      if (preferences.quietHours?.enabled && this.isInQuietHours(preferences.quietHours)) {
        // Allow urgent notifications during quiet hours
        return request.priority === 'urgent';
      }
      
      // Check frequency limits
      if (await this.isFrequencyLimitExceeded(request.userId, userProfile.frequencyTolerance)) {
        // Allow urgent notifications even if frequency limit is exceeded
        return request.priority === 'urgent';
      }
      
      // Check optimal timing
      if (!this.isOptimalTimeForUser(userProfile)) {
        // Allow urgent and high priority notifications at any time
        return request.priority === 'urgent' || request.priority === 'high';
      }
      
      return true;
      
    } catch (error) {
      console.error('Error checking if notification should be sent:', error);
      return false;
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotificationRecord(request: NotificationRequest): Promise<any> {
    try {
      return await db.notification.create({
        data: {
          userId: request.userId,
          bookingId: request.bookingId,
          type: request.type,
          channel: NotificationChannel.PUSH, // Will be updated based on actual delivery
          title: request.title,
          message: request.message,
          data: {
            priority: request.priority,
            channels: request.channels,
            requireDelivery: request.requireDelivery,
            retryPolicy: request.retryPolicy,
            ...request.data
          },
          isRead: false,
          scheduledFor: request.scheduledFor,
          status: NotificationStatus.PENDING,
          maxRetries: request.retryPolicy?.maxRetries || 3
        }
      });
    } catch (error) {
      console.error('Failed to create notification record:', error);
      throw error;
    }
  }

  /**
   * Attempt delivery through multiple channels
   */
  private async attemptDelivery(
    notificationId: string,
    request: NotificationRequest,
    channels: NotificationChannel[]
  ): Promise<{ [key in NotificationChannel]?: { attempted: boolean; delivered: boolean; error?: string } }> {
    const results: any = {};
    
    for (const channel of channels) {
      try {
        results[channel] = { attempted: true, delivered: false };
        
        switch (channel) {
          case NotificationChannel.PUSH:
            const pushResult = await pushNotificationService.sendPushNotification(
              request.userId,
              {
                title: request.title,
                message: request.message,
                data: { ...request.data, notificationId }
              }
            );
            results[channel].delivered = pushResult;
            break;
            
          case NotificationChannel.EMAIL:
            // Email delivery would be implemented here
            results[channel].delivered = true; // Mock success
            break;
            
          case NotificationChannel.SMS:
            // SMS delivery would be implemented here
            results[channel].delivered = true; // Mock success
            break;
            
          case NotificationChannel.WEBSOCKET:
            // WebSocket delivery would be implemented here
            results[channel].delivered = true; // Mock success
            break;
            
          case NotificationChannel.IN_APP:
            // In-app notification delivery would be implemented here
            results[channel].delivered = true; // Mock success
            break;
        }
        
      } catch (error) {
        results[channel] = {
          attempted: true,
          delivered: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return results;
  }

  /**
   * Update notification status based on delivery results
   */
  private async updateNotificationStatus(
    notificationId: string,
    deliveryResults: any
  ): Promise<void> {
    try {
      const anyDelivered = Object.values(deliveryResults).some((result: any) => result.delivered);
      const status = anyDelivered ? NotificationStatus.DELIVERED : NotificationStatus.FAILED;
      
      await db.notification.update({
        where: { id: notificationId },
        data: {
          status,
          sentAt: new Date(),
          data: {
            deliveryResults
          }
        }
      });
    } catch (error) {
      console.error('Failed to update notification status:', error);
    }
  }

  /**
   * Track delivery analytics
   */
  private async trackDeliveryAnalytics(
    notificationId: string,
    request: NotificationRequest,
    deliveryResults: any
  ): Promise<void> {
    try {
      await notificationAnalyticsService.trackNotificationEvent({
        notificationId,
        userId: request.userId,
        eventType: 'delivered',
        timestamp: new Date(),
        metadata: {
          channels: Object.keys(deliveryResults),
          deliveryResults,
          priority: request.priority,
          type: request.type
        }
      });
    } catch (error) {
      console.error('Failed to track delivery analytics:', error);
    }
  }

  // Helper methods
  private isOptimalTimeForChannel(channel: NotificationChannel, userProfile: UserBehaviorProfile): boolean {
    const currentHour = new Date().getHours();
    const { start, end } = userProfile.activeHours;
    
    // Check if current time is within user's active hours
    if (start <= end) {
      return currentHour >= start && currentHour <= end;
    } else {
      // Active hours span midnight
      return currentHour >= start || currentHour <= end;
    }
  }

  private isOptimalTimeForUser(userProfile: UserBehaviorProfile): boolean {
    return this.isOptimalTimeForChannel(NotificationChannel.PUSH, userProfile);
  }

  private isInQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private async isFrequencyLimitExceeded(
    userId: string,
    tolerance: { maxPerHour: number; maxPerDay: number; optimalInterval: number }
  ): Promise<boolean> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hourlyCount, dailyCount] = await Promise.all([
      db.notification.count({
        where: {
          userId,
          createdAt: { gte: oneHourAgo }
        }
      }),
      db.notification.count({
        where: {
          userId,
          createdAt: { gte: oneDayAgo }
        }
      })
    ]);

    return hourlyCount >= tolerance.maxPerHour || dailyCount >= tolerance.maxPerDay;
  }

  private estimateDeliveryTime(channel: NotificationChannel): number {
    // Estimated delivery times in milliseconds
    switch (channel) {
      case NotificationChannel.PUSH:
        return 500;
      case NotificationChannel.WEBSOCKET:
        return 100;
      case NotificationChannel.EMAIL:
        return 2000;
      case NotificationChannel.SMS:
        return 1000;
      case NotificationChannel.IN_APP:
        return 50;
      default:
        return 1000;
    }
  }
}

export const smartNotificationRoutingService = SmartNotificationRoutingService.getInstance();