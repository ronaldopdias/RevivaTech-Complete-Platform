// Production multi-channel notification service
// Supports Email, SMS, Push notifications with user preferences
import { PrismaClient } from '../../generated/prisma';
import { productionEmailService, EmailTemplate } from './emailService.production';
import twilio from 'twilio';
import admin from 'firebase-admin';
import { z } from 'zod';

const prisma = new PrismaClient();

export type NotificationChannel = 'email' | 'sms' | 'push' | 'all';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationFrequency = 'immediate' | 'batched' | 'daily' | 'weekly';

export interface NotificationData {
  userId?: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  title: string;
  message: string;
  template?: EmailTemplate;
  data?: Record<string, any>;
  scheduleAt?: Date;
  respectQuietHours?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UserNotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
  frequency: NotificationFrequency;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  preferences: {
    bookingUpdates: boolean;
    paymentReceipts: boolean;
    repairStatus: boolean;
    promotions: boolean;
    reminders: boolean;
    newsletter: boolean;
  };
}

// Configuration schema
const NotificationConfigSchema = z.object({
  sms: z.object({
    provider: z.enum(['twilio', 'aws-sns']).default('twilio'),
    twilio: z.object({
      accountSid: z.string().optional(),
      authToken: z.string().optional(),
      fromNumber: z.string().optional(),
    }).optional(),
    awsSns: z.object({
      region: z.string().optional(),
      accessKeyId: z.string().optional(),
      secretAccessKey: z.string().optional(),
    }).optional(),
  }).optional(),
  push: z.object({
    provider: z.enum(['firebase', 'apns']).default('firebase'),
    firebase: z.object({
      projectId: z.string().optional(),
      privateKey: z.string().optional(),
      clientEmail: z.string().optional(),
    }).optional(),
    apns: z.object({
      keyId: z.string().optional(),
      teamId: z.string().optional(),
      bundleId: z.string().optional(),
      privateKey: z.string().optional(),
    }).optional(),
  }).optional(),
  rateLimits: z.object({
    smsPerHour: z.number().default(100),
    pushPerMinute: z.number().default(1000),
    emailPerDay: z.number().default(10000),
  }),
});

class ProductionNotificationService {
  private config: z.infer<typeof NotificationConfigSchema>;
  private twilioClient: twilio.Twilio | null = null;
  private firebaseAdmin: admin.app.App | null = null;
  private rateLimitTracker = {
    sms: { count: 0, resetAt: 0 },
    push: { count: 0, resetAt: 0 },
    email: { count: 0, resetAt: 0 },
  };

  constructor() {
    this.loadConfiguration();
    this.initializeSmsProvider();
    this.initializePushProvider();
    
    console.log('Production Notification Service initialized');
  }

  // Load configuration from environment
  private loadConfiguration() {
    const rawConfig = {
      sms: {
        provider: (process.env.SMS_PROVIDER || 'twilio') as 'twilio' | 'aws-sns',
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.TWILIO_FROM_NUMBER,
        },
        awsSns: {
          region: process.env.AWS_SNS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
      push: {
        provider: (process.env.PUSH_PROVIDER || 'firebase') as 'firebase' | 'apns',
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        },
        apns: {
          keyId: process.env.APNS_KEY_ID,
          teamId: process.env.APNS_TEAM_ID,
          bundleId: process.env.APNS_BUNDLE_ID,
          privateKey: process.env.APNS_PRIVATE_KEY,
        },
      },
      rateLimits: {
        smsPerHour: parseInt(process.env.SMS_RATE_LIMIT_PER_HOUR || '100'),
        pushPerMinute: parseInt(process.env.PUSH_RATE_LIMIT_PER_MINUTE || '1000'),
        emailPerDay: parseInt(process.env.EMAIL_RATE_LIMIT_PER_DAY || '10000'),
      },
    };

    this.config = NotificationConfigSchema.parse(rawConfig);
  }

  // Initialize SMS provider
  private initializeSmsProvider() {
    try {
      if (this.config.sms?.provider === 'twilio') {
        const { accountSid, authToken } = this.config.sms.twilio || {};
        if (accountSid && authToken) {
          this.twilioClient = twilio(accountSid, authToken);
          console.log('Twilio SMS client initialized');
        } else {
          console.warn('Twilio credentials not configured');
        }
      }
    } catch (error) {
      console.error('Failed to initialize SMS provider:', error);
    }
  }

  // Initialize push notification provider
  private initializePushProvider() {
    try {
      if (this.config.push?.provider === 'firebase') {
        const { projectId, privateKey, clientEmail } = this.config.push.firebase || {};
        if (projectId && privateKey && clientEmail) {
          if (!admin.apps.length) {
            this.firebaseAdmin = admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                privateKey,
                clientEmail,
              }),
            });
          } else {
            this.firebaseAdmin = admin.app();
          }
          console.log('Firebase push notification service initialized');
        } else {
          console.warn('Firebase credentials not configured');
        }
      }
    } catch (error) {
      console.error('Failed to initialize push notification provider:', error);
    }
  }

  // Send notification via multiple channels
  public async sendNotification(notification: NotificationData): Promise<{
    success: boolean;
    results: {
      email?: { success: boolean; messageId?: string; error?: string };
      sms?: { success: boolean; messageId?: string; error?: string };
      push?: { success: boolean; messageId?: string; error?: string };
    };
    errors?: string[];
  }> {
    const results: any = {};
    const errors: string[] = [];

    try {
      // Get user preferences if userId provided
      let userPreferences: UserNotificationPreferences | null = null;
      if (notification.userId) {
        userPreferences = await this.getUserPreferences(notification.userId);
      }

      // Check quiet hours
      if (notification.respectQuietHours && userPreferences?.quietHours?.enabled) {
        if (this.isInQuietHours(userPreferences.quietHours)) {
          // Schedule for after quiet hours
          const scheduleTime = this.calculateNextAllowedTime(userPreferences.quietHours);
          notification.scheduleAt = scheduleTime;
        }
      }

      // Send via requested channels
      for (const channel of notification.channels) {
        if (channel === 'all') {
          // Send via all available channels
          if (!userPreferences || userPreferences.email) {
            results.email = await this.sendEmailNotification(notification);
          }
          if (!userPreferences || userPreferences.sms) {
            results.sms = await this.sendSmsNotification(notification);
          }
          if (!userPreferences || userPreferences.push) {
            results.push = await this.sendPushNotification(notification);
          }
        } else {
          // Check user preferences
          if (userPreferences && !userPreferences[channel]) {
            console.log(`User has disabled ${channel} notifications`);
            continue;
          }

          switch (channel) {
            case 'email':
              results.email = await this.sendEmailNotification(notification);
              break;
            case 'sms':
              results.sms = await this.sendSmsNotification(notification);
              break;
            case 'push':
              results.push = await this.sendPushNotification(notification);
              break;
          }
        }
      }

      // Log notification in database
      await this.logNotification(notification, results);

      // Check if any channel succeeded
      const success = Object.values(results).some((result: any) => result.success);

      return {
        success,
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return {
        success: false,
        results,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Send email notification
  private async sendEmailNotification(notification: NotificationData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.checkRateLimit('email')) {
        return { success: false, error: 'Email rate limit exceeded' };
      }

      const messageId = await productionEmailService.queueEmail({
        to: notification.userId ? await this.getUserEmail(notification.userId) : 'admin@revivatech.co.uk',
        subject: notification.title,
        template: notification.template || 'repair-status-update',
        data: {
          title: notification.title,
          message: notification.message,
          ...notification.data,
        },
        priority: notification.priority,
        scheduleAt: notification.scheduleAt,
        tags: notification.tags,
        metadata: notification.metadata,
      });

      this.trackRateLimit('email');
      return { success: true, messageId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Send SMS notification
  private async sendSmsNotification(notification: NotificationData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.twilioClient) {
        return { success: false, error: 'SMS provider not configured' };
      }

      if (!this.checkRateLimit('sms')) {
        return { success: false, error: 'SMS rate limit exceeded' };
      }

      const phoneNumber = notification.userId 
        ? await this.getUserPhoneNumber(notification.userId)
        : null;

      if (!phoneNumber) {
        return { success: false, error: 'User phone number not available' };
      }

      // Queue SMS in database
      const smsItem = await prisma.smsQueue.create({
        data: {
          to: phoneNumber,
          message: `${notification.title}\n\n${notification.message}`,
          template: notification.template,
          data: notification.data,
          priority: notification.priority,
          scheduledAt: notification.scheduleAt || new Date(),
          metadata: notification.metadata,
        },
      });

      // Send immediately if not scheduled
      if (!notification.scheduleAt || notification.scheduleAt <= new Date()) {
        const result = await this.twilioClient.messages.create({
          body: `${notification.title}\n\n${notification.message}`,
          from: this.config.sms?.twilio?.fromNumber,
          to: phoneNumber,
        });

        // Update database
        await prisma.smsQueue.update({
          where: { id: smsItem.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            messageId: result.sid,
          },
        });

        this.trackRateLimit('sms');
        return { success: true, messageId: result.sid };
      }

      return { success: true, messageId: smsItem.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Send push notification
  private async sendPushNotification(notification: NotificationData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.firebaseAdmin) {
        return { success: false, error: 'Push notification provider not configured' };
      }

      if (!this.checkRateLimit('push')) {
        return { success: false, error: 'Push notification rate limit exceeded' };
      }

      const deviceTokens = notification.userId 
        ? await this.getUserDeviceTokens(notification.userId)
        : [];

      if (deviceTokens.length === 0) {
        return { success: false, error: 'No device tokens available' };
      }

      // Queue push notification in database
      const pushItem = await prisma.pushNotificationQueue.create({
        data: {
          userId: notification.userId,
          deviceTokens,
          title: notification.title,
          body: notification.message,
          data: notification.data,
          priority: notification.priority,
          scheduledAt: notification.scheduleAt || new Date(),
          metadata: notification.metadata,
        },
      });

      // Send immediately if not scheduled
      if (!notification.scheduleAt || notification.scheduleAt <= new Date()) {
        const message = {
          notification: {
            title: notification.title,
            body: notification.message,
          },
          data: notification.data ? 
            Object.fromEntries(
              Object.entries(notification.data).map(([k, v]) => [k, String(v)])
            ) : undefined,
          tokens: deviceTokens,
        };

        const response = await this.firebaseAdmin.messaging().sendMulticast(message);

        // Update database
        await prisma.pushNotificationQueue.update({
          where: { id: pushItem.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            deliveryCount: response.successCount,
          },
        });

        this.trackRateLimit('push');
        return { 
          success: response.successCount > 0, 
          messageId: pushItem.id 
        };
      }

      return { success: true, messageId: pushItem.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // User preference management
  public async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!prefs) {
        // Create default preferences
        return await this.createDefaultPreferences(userId);
      }

      return {
        email: prefs.email,
        sms: prefs.sms,
        push: prefs.push,
        marketing: prefs.marketing,
        frequency: prefs.frequency as NotificationFrequency,
        quietHours: prefs.quietHours as any,
        preferences: prefs.preferences as any,
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  public async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<boolean> {
    try {
      await prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...preferences,
          quietHours: preferences.quietHours,
          preferences: preferences.preferences,
        },
        update: {
          ...preferences,
          quietHours: preferences.quietHours,
          preferences: preferences.preferences,
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return false;
    }
  }

  // Helper methods
  private async createDefaultPreferences(userId: string): Promise<UserNotificationPreferences> {
    const defaultPrefs: UserNotificationPreferences = {
      email: true,
      sms: false,
      push: true,
      marketing: false,
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'Europe/London',
      },
      preferences: {
        bookingUpdates: true,
        paymentReceipts: true,
        repairStatus: true,
        promotions: false,
        reminders: true,
        newsletter: false,
      },
    };

    await this.updateUserPreferences(userId, defaultPrefs);
    return defaultPrefs;
  }

  private async getUserEmail(userId: string): Promise<string> {
    try {
      const user = await prisma.customer.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      return user?.email || 'admin@revivatech.co.uk';
    } catch (error) {
      return 'admin@revivatech.co.uk';
    }
  }

  private async getUserPhoneNumber(userId: string): Promise<string | null> {
    try {
      const user = await prisma.customer.findUnique({
        where: { id: userId },
        select: { phone: true },
      });
      return user?.phone || null;
    } catch (error) {
      return null;
    }
  }

  private async getUserDeviceTokens(userId: string): Promise<string[]> {
    try {
      // This would need to be implemented based on your user device token storage
      // For now, return empty array
      return [];
    } catch (error) {
      return [];
    }
  }

  private isInQuietHours(quietHours: UserNotificationPreferences['quietHours']): boolean {
    if (!quietHours?.enabled) return false;

    const now = new Date();
    const timezone = quietHours.timezone || 'Europe/London';
    
    // This is a simplified implementation
    // In production, you'd want to use a proper timezone library
    const currentHour = now.getHours();
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);

    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private calculateNextAllowedTime(quietHours: UserNotificationPreferences['quietHours']): Date {
    const now = new Date();
    const endHour = parseInt(quietHours!.end.split(':')[0]);
    const endMinute = parseInt(quietHours!.end.split(':')[1] || '0');
    
    const nextAllowed = new Date(now);
    nextAllowed.setHours(endHour, endMinute, 0, 0);
    
    if (nextAllowed <= now) {
      nextAllowed.setDate(nextAllowed.getDate() + 1);
    }
    
    return nextAllowed;
  }

  private checkRateLimit(channel: 'email' | 'sms' | 'push'): boolean {
    const now = Date.now();
    const tracker = this.rateLimitTracker[channel];
    
    // Reset counter based on channel-specific windows
    const windows = {
      email: 86400000, // 24 hours
      sms: 3600000,    // 1 hour
      push: 60000,     // 1 minute
    };
    
    if (now >= tracker.resetAt) {
      tracker.count = 0;
      tracker.resetAt = now + windows[channel];
    }
    
    const limits = {
      email: this.config.rateLimits.emailPerDay,
      sms: this.config.rateLimits.smsPerHour,
      push: this.config.rateLimits.pushPerMinute,
    };
    
    return tracker.count < limits[channel];
  }

  private trackRateLimit(channel: 'email' | 'sms' | 'push'): void {
    this.rateLimitTracker[channel].count++;
  }

  private async logNotification(
    notification: NotificationData, 
    results: Record<string, any>
  ): Promise<void> {
    try {
      // Log to database for analytics
      console.log('Notification sent:', {
        userId: notification.userId,
        channels: notification.channels,
        priority: notification.priority,
        results,
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  // Analytics and monitoring
  public async getNotificationStats(dateFrom: Date, dateTo: Date): Promise<any> {
    try {
      const [emailStats, smsStats, pushStats] = await Promise.all([
        prisma.emailQueue.groupBy({
          by: ['status'],
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          _count: { status: true },
        }),
        prisma.smsQueue.groupBy({
          by: ['status'],
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          _count: { status: true },
        }),
        prisma.pushNotificationQueue.groupBy({
          by: ['status'],
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          _count: { status: true },
        }),
      ]);

      return {
        email: emailStats,
        sms: smsStats,
        push: pushStats,
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const productionNotificationService = new ProductionNotificationService();