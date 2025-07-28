// Push Notification API Endpoint
// Handles push notification management, subscription, and delivery

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { pushNotificationService } from '@/lib/services/pushNotificationService';
import { smartNotificationRoutingService } from '@/lib/services/smartNotificationRoutingService';
import { notificationAnalyticsService } from '@/lib/services/notificationAnalyticsService';
import { NotificationType, NotificationChannel } from '@/generated/prisma';

// GET /api/notifications/push - Get push notification status and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    switch (action) {
      case 'subscription-status':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 });
        }

        // Check if user has push subscriptions
        const user = await db.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'User not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            userId,
            hasSubscription: false, // Would check actual subscription status
            permissionStatus: 'default', // Would get from browser
            preferences: await pushNotificationService.getUserNotificationPreferences(userId)
          }
        });

      case 'analytics':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 });
        }

        const analytics = await notificationAnalyticsService.getNotificationAnalytics({
          userId,
          channel: NotificationChannel.PUSH
        });

        return NextResponse.json({
          success: true,
          data: analytics
        });

      case 'channel-optimization':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 });
        }

        const type = searchParams.get('type') as NotificationType || NotificationType.BOOKING_CONFIRMATION;
        const priority = searchParams.get('priority') || 'normal';

        const optimizations = await smartNotificationRoutingService.optimizeChannelSelection(
          userId,
          type,
          priority
        );

        return NextResponse.json({
          success: true,
          data: {
            optimizations,
            recommendedChannels: optimizations.slice(0, 2).map(opt => opt.channel)
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Push notification GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/notifications/push - Send push notification or manage subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, data } = body;

    switch (action) {
      case 'subscribe':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 });
        }

        const subscriptionData = await pushNotificationService.subscribeToPushNotifications(userId);
        
        return NextResponse.json({
          success: true,
          data: {
            subscribed: !!subscriptionData,
            subscription: subscriptionData
          },
          message: 'Successfully subscribed to push notifications'
        });

      case 'unsubscribe':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 });
        }

        const unsubscribed = await pushNotificationService.unsubscribeFromPushNotifications(userId);
        
        return NextResponse.json({
          success: true,
          data: { unsubscribed },
          message: 'Successfully unsubscribed from push notifications'
        });

      case 'send':
        if (!userId || !data?.title || !data?.message) {
          return NextResponse.json({
            success: false,
            error: 'userId, title, and message are required'
          }, { status: 400 });
        }

        const notificationRequest = {
          userId,
          type: data.type || NotificationType.SYSTEM_ALERT,
          title: data.title,
          message: data.message,
          data: data.data || {},
          priority: data.priority || 'normal',
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          bookingId: data.bookingId,
          channels: data.channels || [NotificationChannel.PUSH],
          requireDelivery: data.requireDelivery || false,
          retryPolicy: data.retryPolicy
        };

        const result = await smartNotificationRoutingService.sendNotification(notificationRequest);
        
        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.success ? 'Notification sent successfully' : 'Failed to send notification'
        });

      case 'send-bulk':
        if (!Array.isArray(data?.notifications)) {
          return NextResponse.json({
            success: false,
            error: 'notifications array is required'
          }, { status: 400 });
        }

        const bulkResults = await Promise.all(
          data.notifications.map(async (notification: any) => {
            const request = {
              userId: notification.userId,
              type: notification.type || NotificationType.SYSTEM_ALERT,
              title: notification.title,
              message: notification.message,
              data: notification.data || {},
              priority: notification.priority || 'normal',
              channels: notification.channels || [NotificationChannel.PUSH]
            };

            return await smartNotificationRoutingService.sendNotification(request);
          })
        );

        const successCount = bulkResults.filter(result => result.success).length;
        const failureCount = bulkResults.length - successCount;

        return NextResponse.json({
          success: true,
          data: {
            total: bulkResults.length,
            success: successCount,
            failed: failureCount,
            results: bulkResults
          },
          message: `Sent ${successCount} notifications, ${failureCount} failed`
        });

      case 'test':
        const testUserId = userId || 'test-user';
        const testNotification = {
          userId: testUserId,
          type: NotificationType.SYSTEM_ALERT,
          title: 'Test Notification',
          message: 'This is a test push notification from RevivaTech',
          data: {
            testData: true,
            timestamp: new Date().toISOString()
          },
          priority: 'normal' as const
        };

        const testResult = await smartNotificationRoutingService.sendNotification(testNotification);
        
        return NextResponse.json({
          success: testResult.success,
          data: testResult,
          message: 'Test notification sent'
        });

      case 'update-preferences':
        if (!userId || !data?.preferences) {
          return NextResponse.json({
            success: false,
            error: 'userId and preferences are required'
          }, { status: 400 });
        }

        await pushNotificationService.updateNotificationPreferences(userId, data.preferences);
        
        return NextResponse.json({
          success: true,
          message: 'Notification preferences updated successfully'
        });

      case 'get-optimization':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 });
        }

        const optimizationType = data?.type || NotificationType.BOOKING_CONFIRMATION;
        const optimizationPriority = data?.priority || 'normal';

        const channelOptimizations = await smartNotificationRoutingService.optimizeChannelSelection(
          userId,
          optimizationType,
          optimizationPriority
        );

        return NextResponse.json({
          success: true,
          data: {
            userId,
            type: optimizationType,
            priority: optimizationPriority,
            optimizations: channelOptimizations,
            recommendedChannels: channelOptimizations.slice(0, 2).map(opt => opt.channel)
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Push notification POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/notifications/push - Update push notification settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences, subscription } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 });
    }

    // Update user preferences
    if (preferences) {
      await pushNotificationService.updateNotificationPreferences(userId, preferences);
    }

    // Update subscription data
    if (subscription) {
      // This would update the subscription in the database
      console.log('Updating subscription data:', { userId, subscription });
    }

    return NextResponse.json({
      success: true,
      message: 'Push notification settings updated successfully'
    });

  } catch (error) {
    console.error('Push notification PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/notifications/push - Delete push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    const unsubscribed = await pushNotificationService.unsubscribeFromPushNotifications(userId);

    return NextResponse.json({
      success: true,
      data: { unsubscribed },
      message: 'Push subscription deleted successfully'
    });

  } catch (error) {
    console.error('Push notification DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}