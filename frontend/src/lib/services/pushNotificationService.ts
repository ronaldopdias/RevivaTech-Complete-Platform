// Advanced Push Notification Service for RevivaTech
// Handles browser push notifications, service worker management, and notification delivery

import { db } from '@/lib/database/client';
import { NotificationType, NotificationChannel, NotificationStatus } from '@/generated/prisma';

export interface PushNotificationPayload {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  types: {
    [key in NotificationType]: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  frequency?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private webPush: any;

  private constructor() {
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
    
    if (typeof window === 'undefined') {
      // Server-side initialization
      this.initializeWebPush();
    }
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private async initializeWebPush() {
    try {
      const webPush = await import('web-push');
      this.webPush = webPush.default;
      
      if (this.vapidPublicKey && this.vapidPrivateKey) {
        this.webPush.setVapidDetails(
          'mailto:support@revivatech.co.uk',
          this.vapidPublicKey,
          this.vapidPrivateKey
        );
      }
    } catch (error) {
      console.error('Failed to initialize web-push:', error);
    }
  }

  // Client-side methods
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  public async subscribeToPushNotifications(userId: string): Promise<PushSubscriptionData | null> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Store subscription in database
      await this.saveSubscriptionToDatabase(userId, subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  public async unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromDatabase(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  public async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      if (!this.webPush) {
        await this.initializeWebPush();
      }

      const subscriptions = await this.getUserSubscriptions(userId);
      if (subscriptions.length === 0) {
        console.warn(`No push subscriptions found for user: ${userId}`);
        return false;
      }

      const notificationPayload = {
        title: payload.title,
        body: payload.message,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        image: payload.image,
        tag: payload.tag || `revivatech-${Date.now()}`,
        data: {
          ...payload.data,
          timestamp: payload.timestamp || Date.now(),
          url: payload.data?.url || '/dashboard'
        },
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        vibrate: payload.vibrate || [200, 100, 200],
        timestamp: payload.timestamp || Date.now()
      };

      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          return this.webPush.sendNotification(
            subscription,
            JSON.stringify(notificationPayload)
          );
        })
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.filter(result => result.status === 'rejected').length;

      console.log(`Push notifications sent - Success: ${successCount}, Failed: ${failureCount}`);

      // Update notification status in database
      await this.updateNotificationDeliveryStatus(userId, payload.data?.notificationId, {
        delivered: successCount > 0,
        failureCount,
        successCount
      });

      return successCount > 0;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  public async sendBulkPushNotifications(
    notifications: Array<{
      userId: string;
      payload: PushNotificationPayload;
    }>
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      notifications.map(({ userId, payload }) => 
        this.sendPushNotification(userId, payload)
      )
    );

    const success = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    const failed = results.length - success;

    return { success, failed };
  }

  public async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          // Add preferences field to User model if needed
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Default preferences if not set
      const defaultPreferences: NotificationPreferences = {
        enabled: true,
        channels: {
          push: true,
          email: true,
          sms: false
        },
        types: {
          [NotificationType.BOOKING_CONFIRMATION]: true,
          [NotificationType.STATUS_UPDATE]: true,
          [NotificationType.PAYMENT_REQUEST]: true,
          [NotificationType.COMPLETION_NOTICE]: true,
          [NotificationType.REMINDER]: true,
          [NotificationType.PROMOTIONAL]: false,
          [NotificationType.SYSTEM_ALERT]: true
        },
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        frequency: {
          maxPerHour: 5,
          maxPerDay: 20
        }
      };

      return defaultPreferences;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  public async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      // Store preferences in database
      // For now, we'll store in the user's data field or create a separate preferences table
      await db.user.update({
        where: { id: userId },
        data: {
          // Store preferences in a JSON field or separate table
          // This would require updating the User model
        }
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  public async shouldSendNotification(
    userId: string,
    type: NotificationType,
    channel: NotificationChannel
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId);
      
      // Check if notifications are enabled globally
      if (!preferences.enabled) {
        return false;
      }

      // Check if the specific channel is enabled
      if (channel === NotificationChannel.PUSH && !preferences.channels.push) {
        return false;
      }

      // Check if the specific notification type is enabled
      if (!preferences.types[type]) {
        return false;
      }

      // Check quiet hours
      if (preferences.quietHours?.enabled && this.isInQuietHours(preferences.quietHours)) {
        return false;
      }

      // Check frequency limits
      if (preferences.frequency && await this.isFrequencyLimitReached(userId, preferences.frequency)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Private utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return window.btoa(binary);
  }

  private async saveSubscriptionToDatabase(userId: string, subscription: PushSubscriptionData): Promise<void> {
    // Store subscription in database
    // This would require creating a PushSubscription model
    console.log('Saving subscription to database:', { userId, subscription });
  }

  private async removeSubscriptionFromDatabase(userId: string): Promise<void> {
    // Remove subscription from database
    console.log('Removing subscription from database:', { userId });
  }

  private async getUserSubscriptions(userId: string): Promise<any[]> {
    // Get user's push subscriptions from database
    // This would require creating a PushSubscription model
    console.log('Getting user subscriptions:', { userId });
    return [];
  }

  private async updateNotificationDeliveryStatus(
    userId: string,
    notificationId: string,
    status: { delivered: boolean; failureCount: number; successCount: number }
  ): Promise<void> {
    if (!notificationId) return;

    try {
      await db.notification.update({
        where: { id: notificationId },
        data: {
          status: status.delivered ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
          data: {
            deliveryStatus: status
          }
        }
      });
    } catch (error) {
      console.error('Failed to update notification delivery status:', error);
    }
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
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private async isFrequencyLimitReached(
    userId: string,
    frequency: { maxPerHour: number; maxPerDay: number }
  ): Promise<boolean> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hourlyCount, dailyCount] = await Promise.all([
      db.notification.count({
        where: {
          userId,
          createdAt: { gte: oneHourAgo },
          channel: NotificationChannel.PUSH
        }
      }),
      db.notification.count({
        where: {
          userId,
          createdAt: { gte: oneDayAgo },
          channel: NotificationChannel.PUSH
        }
      })
    ]);

    return hourlyCount >= frequency.maxPerHour || dailyCount >= frequency.maxPerDay;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();