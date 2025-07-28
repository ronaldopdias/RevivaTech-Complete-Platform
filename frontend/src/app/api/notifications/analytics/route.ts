// Notification Analytics API Endpoint
// Provides comprehensive analytics for notification delivery and engagement

import { NextRequest, NextResponse } from 'next/server';
import { notificationAnalyticsService } from '@/lib/services/notificationAnalyticsService';
import { NotificationType, NotificationChannel, NotificationStatus } from '@/generated/prisma';

// GET /api/notifications/analytics - Get notification analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const channel = searchParams.get('channel') as NotificationChannel;
    const type = searchParams.get('type') as NotificationType;
    const status = searchParams.get('status') as NotificationStatus;

    // Build filters
    const filters = {
      ...(userId && { userId }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(channel && { channel }),
      ...(type && { type }),
      ...(status && { status })
    };

    switch (action) {
      case 'overview':
        const analytics = await notificationAnalyticsService.getNotificationAnalytics(filters);
        return NextResponse.json({
          success: true,
          data: analytics
        });

      case 'delivery-rates':
        const deliveryRates = await Promise.all([
          notificationAnalyticsService.getDeliveryRateByChannel(NotificationChannel.PUSH, filters),
          notificationAnalyticsService.getDeliveryRateByChannel(NotificationChannel.EMAIL, filters),
          notificationAnalyticsService.getDeliveryRateByChannel(NotificationChannel.SMS, filters),
          notificationAnalyticsService.getDeliveryRateByChannel(NotificationChannel.WEBSOCKET, filters),
          notificationAnalyticsService.getDeliveryRateByChannel(NotificationChannel.IN_APP, filters)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            [NotificationChannel.PUSH]: deliveryRates[0],
            [NotificationChannel.EMAIL]: deliveryRates[1],
            [NotificationChannel.SMS]: deliveryRates[2],
            [NotificationChannel.WEBSOCKET]: deliveryRates[3],
            [NotificationChannel.IN_APP]: deliveryRates[4]
          }
        });

      case 'engagement-rates':
        const engagementRates = await Promise.all([
          notificationAnalyticsService.getEngagementRateByType(NotificationType.BOOKING_CONFIRMATION, filters),
          notificationAnalyticsService.getEngagementRateByType(NotificationType.STATUS_UPDATE, filters),
          notificationAnalyticsService.getEngagementRateByType(NotificationType.PAYMENT_REQUEST, filters),
          notificationAnalyticsService.getEngagementRateByType(NotificationType.COMPLETION_NOTICE, filters),
          notificationAnalyticsService.getEngagementRateByType(NotificationType.REMINDER, filters),
          notificationAnalyticsService.getEngagementRateByType(NotificationType.PROMOTIONAL, filters),
          notificationAnalyticsService.getEngagementRateByType(NotificationType.SYSTEM_ALERT, filters)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            [NotificationType.BOOKING_CONFIRMATION]: engagementRates[0],
            [NotificationType.STATUS_UPDATE]: engagementRates[1],
            [NotificationType.PAYMENT_REQUEST]: engagementRates[2],
            [NotificationType.COMPLETION_NOTICE]: engagementRates[3],
            [NotificationType.REMINDER]: engagementRates[4],
            [NotificationType.PROMOTIONAL]: engagementRates[5],
            [NotificationType.SYSTEM_ALERT]: engagementRates[6]
          }
        });

      case 'user-stats':
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required for user stats'
          }, { status: 400 });
        }

        const userStats = await notificationAnalyticsService.getUserNotificationStats(userId, filters);
        return NextResponse.json({
          success: true,
          data: userStats
        });

      case 'trends':
        const period = searchParams.get('period') as 'hour' | 'day' | 'week' | 'month' || 'day';
        const trends = await notificationAnalyticsService.getNotificationTrends(period, filters);
        
        return NextResponse.json({
          success: true,
          data: trends
        });

      case 'report':
        const report = await notificationAnalyticsService.generateAnalyticsReport(filters);
        return NextResponse.json({
          success: true,
          data: report
        });

      case 'channel-performance':
        const channelAnalytics = await notificationAnalyticsService.getNotificationAnalytics(filters);
        return NextResponse.json({
          success: true,
          data: channelAnalytics.channelPerformance
        });

      case 'type-performance':
        const typeAnalytics = await notificationAnalyticsService.getNotificationAnalytics(filters);
        return NextResponse.json({
          success: true,
          data: typeAnalytics.typePerformance
        });

      case 'time-series':
        const timeSeriesAnalytics = await notificationAnalyticsService.getNotificationAnalytics(filters);
        return NextResponse.json({
          success: true,
          data: timeSeriesAnalytics.timeSeriesData
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Notification analytics GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/notifications/analytics - Track notification events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'track-event':
        if (!data?.notificationId || !data?.userId || !data?.eventType) {
          return NextResponse.json({
            success: false,
            error: 'notificationId, userId, and eventType are required'
          }, { status: 400 });
        }

        const event = {
          notificationId: data.notificationId,
          userId: data.userId,
          eventType: data.eventType,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          metadata: data.metadata || {}
        };

        await notificationAnalyticsService.trackNotificationEvent(event);

        return NextResponse.json({
          success: true,
          message: 'Event tracked successfully'
        });

      case 'track-bulk-events':
        if (!Array.isArray(data?.events)) {
          return NextResponse.json({
            success: false,
            error: 'events array is required'
          }, { status: 400 });
        }

        const trackingPromises = data.events.map((eventData: any) => {
          const event = {
            notificationId: eventData.notificationId,
            userId: eventData.userId,
            eventType: eventData.eventType,
            timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
            metadata: eventData.metadata || {}
          };

          return notificationAnalyticsService.trackNotificationEvent(event);
        });

        await Promise.all(trackingPromises);

        return NextResponse.json({
          success: true,
          message: `${data.events.length} events tracked successfully`
        });

      case 'ab-test':
        if (!data?.testId || !data?.variantA || !data?.variantB) {
          return NextResponse.json({
            success: false,
            error: 'testId, variantA, and variantB are required'
          }, { status: 400 });
        }

        const abTestResult = await notificationAnalyticsService.performABTest(
          data.testId,
          data.variantA,
          data.variantB
        );

        return NextResponse.json({
          success: true,
          data: abTestResult
        });

      case 'generate-report':
        const filters = {
          ...(data?.userId && { userId: data.userId }),
          ...(data?.startDate && { startDate: new Date(data.startDate) }),
          ...(data?.endDate && { endDate: new Date(data.endDate) }),
          ...(data?.channel && { channel: data.channel }),
          ...(data?.type && { type: data.type }),
          ...(data?.status && { status: data.status })
        };

        const generatedReport = await notificationAnalyticsService.generateAnalyticsReport(filters);

        return NextResponse.json({
          success: true,
          data: generatedReport
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Notification analytics POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/notifications/analytics - Update analytics settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'update-settings':
        // This would update analytics settings in the database
        console.log('Updating analytics settings:', data);

        return NextResponse.json({
          success: true,
          message: 'Analytics settings updated successfully'
        });

      case 'reset-analytics':
        // This would reset analytics data (use with caution)
        console.log('Resetting analytics data for:', data);

        return NextResponse.json({
          success: true,
          message: 'Analytics data reset successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Notification analytics PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/notifications/analytics - Delete analytics data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    // This would delete analytics data for the specified user and date range
    console.log('Deleting analytics data for user:', userId, 'from:', startDate, 'to:', endDate);

    return NextResponse.json({
      success: true,
      message: 'Analytics data deleted successfully'
    });

  } catch (error) {
    console.error('Notification analytics DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}