import { NextRequest, NextResponse } from 'next/server';
import { wsManager } from '../websocket/route';
import { db } from '@/lib/database/client';
import { NotificationType, NotificationChannel, NotificationStatus } from '@/generated/prisma';

// Enhanced notification interface for API responses
interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  persistent: boolean;
  expiresAt?: string;
  bookingId?: string;
  customerId?: string;
  data?: any;
  actions?: NotificationAction[];
  channel: NotificationChannel;
  status: NotificationStatus;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  url?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Notification templates with proper database enum values
const notificationTemplates = {
  'booking-confirmed': {
    title: 'Booking Confirmed',
    message: 'Your repair appointment has been confirmed for {date} at {time}',
    priority: 'normal' as NotificationPriority,
    type: NotificationType.BOOKING_CONFIRMATION,
    channel: NotificationChannel.PUSH,
    actions: [
      { id: 'view', label: 'View Details', type: 'button' as const, style: 'primary' as const },
      { id: 'reschedule', label: 'Reschedule', type: 'button' as const, style: 'secondary' as const }
    ]
  },
  'status-update': {
    title: 'Repair Status Update',
    message: 'Your {device} repair status has been updated to: {status}',
    priority: 'normal' as NotificationPriority,
    type: NotificationType.STATUS_UPDATE,
    channel: NotificationChannel.PUSH,
    actions: [
      { id: 'track', label: 'Track Progress', type: 'button' as const, style: 'primary' as const }
    ]
  },
  'repair-completed': {
    title: 'Repair Completed',
    message: 'Great news! Your {device} repair has been completed',
    priority: 'high' as NotificationPriority,
    type: NotificationType.COMPLETION_NOTICE,
    channel: NotificationChannel.PUSH,
    actions: [
      { id: 'schedule-pickup', label: 'Schedule Pickup', type: 'button' as const, style: 'primary' as const },
      { id: 'view-invoice', label: 'View Invoice', type: 'button' as const, style: 'secondary' as const }
    ]
  },
  'payment-required': {
    title: 'Payment Required',
    message: 'Please complete payment of {amount} to proceed with your repair',
    priority: 'urgent' as NotificationPriority,
    type: NotificationType.PAYMENT_REQUEST,
    channel: NotificationChannel.PUSH,
    persistent: true,
    actions: [
      { id: 'pay-now', label: 'Pay Now', type: 'button' as const, style: 'primary' as const }
    ]
  },
  'reminder': {
    title: 'Appointment Reminder',
    message: 'Don\'t forget your repair appointment tomorrow at {time}',
    priority: 'normal' as NotificationPriority,
    type: NotificationType.REMINDER,
    channel: NotificationChannel.PUSH,
    actions: [
      { id: 'confirm', label: 'Confirm', type: 'button' as const, style: 'primary' as const },
      { id: 'reschedule', label: 'Reschedule', type: 'button' as const, style: 'secondary' as const }
    ]
  },
  'promotional': {
    title: 'Special Offer',
    message: '{offer} - Limited time offer on {service}',
    priority: 'low' as NotificationPriority,
    type: NotificationType.PROMOTIONAL,
    channel: NotificationChannel.PUSH,
    actions: [
      { id: 'learn-more', label: 'Learn More', type: 'button' as const, style: 'primary' as const }
    ]
  },
  'system-alert': {
    title: 'System Alert',
    message: '{alertMessage}',
    priority: 'high' as NotificationPriority,
    type: NotificationType.SYSTEM_ALERT,
    channel: NotificationChannel.PUSH,
    actions: [
      { id: 'acknowledge', label: 'Acknowledge', type: 'button' as const, style: 'primary' as const }
    ]
  }
};

function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match;
  });
}

// Convert database notification to API response format
function formatNotificationResponse(notification: any): NotificationResponse {
  const data = notification.data || {};
  
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    priority: data.priority || 'normal',
    title: notification.title,
    message: notification.message,
    timestamp: notification.createdAt.toISOString(),
    read: notification.isRead,
    dismissed: data.dismissed || false,
    persistent: data.persistent || false,
    expiresAt: data.expiresAt,
    bookingId: notification.bookingId,
    customerId: notification.userId,
    data: data,
    actions: data.actions || [],
    channel: notification.channel,
    status: notification.status
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const totalNotifications = await db.notification.count();
        const userCount = await db.user.count();
        const unreadCount = await db.notification.count({
          where: { isRead: false }
        });
        
        return NextResponse.json({
          success: true,
          stats: {
            total: totalNotifications,
            users: userCount,
            unread: unreadCount
          }
        });

      case 'templates':
        return NextResponse.json({
          success: true,
          templates: notificationTemplates
        });

      default:
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 });
        }

        // Get notifications for user from database
        const dbNotifications = await db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50 // Limit to recent 50 notifications
        });

        const notifications = dbNotifications.map(formatNotificationResponse);
        const userUnreadCount = notifications.filter(n => !n.read).length;

        return NextResponse.json({
          success: true,
          notifications: notifications,
          unreadCount: userUnreadCount
        });
    }

  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, templateId, data } = body;

    switch (action) {
      case 'create':
        if (!userId || !templateId) {
          return NextResponse.json({
            success: false,
            error: 'userId and templateId are required'
          }, { status: 400 });
        }

        const template = notificationTemplates[templateId as keyof typeof notificationTemplates];
        if (!template) {
          return NextResponse.json({
            success: false,
            error: 'Invalid template ID'
          }, { status: 400 });
        }

        // Verify user exists
        const user = await db.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'User not found'
          }, { status: 404 });
        }

        // Create notification in database
        const notificationData = {
          userId,
          bookingId: data?.bookingId || null,
          type: template.type,
          channel: template.channel,
          title: interpolateTemplate(template.title, data || {}),
          message: interpolateTemplate(template.message, data || {}),
          data: {
            priority: template.priority,
            persistent: template.persistent || false,
            actions: template.actions,
            dismissed: false,
            expiresAt: data?.expiresAt,
            ...data
          },
          isRead: false,
          sentAt: new Date(),
          scheduledFor: data?.scheduledFor ? new Date(data.scheduledFor) : null,
          status: NotificationStatus.SENT
        };

        const dbNotification = await db.notification.create({
          data: notificationData
        });

        // Format for API response
        const apiNotification = formatNotificationResponse(dbNotification);

        // Send via WebSocket if user is connected
        const wsNotification = {
          id: apiNotification.id,
          type: apiNotification.type,
          priority: apiNotification.priority,
          title: apiNotification.title,
          message: apiNotification.message,
          timestamp: apiNotification.timestamp,
          persistent: apiNotification.persistent,
          actions: apiNotification.actions,
          data: apiNotification.data,
          bookingId: apiNotification.bookingId
        };

        wsManager.sendToUser(userId, wsNotification);

        return NextResponse.json({
          success: true,
          notification: apiNotification,
          message: 'Notification created and sent'
        });

      case 'test':
        const testUserId = userId || 'test-user';
        const testTemplateId = data?.template || 'booking-confirmed';
        const testData = {
          date: 'Tomorrow',
          time: '2:00 PM',
          device: 'iPhone 14 Pro',
          amount: '$199',
          ...data
        };

        return await POST(new NextRequest(request.url, {
          method: 'POST',
          body: JSON.stringify({
            action: 'create',
            userId: testUserId,
            templateId: testTemplateId,
            data: testData
          })
        }));

      case 'bulk-create':
        if (!Array.isArray(body.notifications)) {
          return NextResponse.json({
            success: false,
            error: 'notifications array is required'
          }, { status: 400 });
        }

        const bulkNotifications = [];
        for (const notifData of body.notifications) {
          const template = notificationTemplates[notifData.templateId as keyof typeof notificationTemplates];
          if (!template) continue;

          bulkNotifications.push({
            userId: notifData.userId,
            bookingId: notifData.data?.bookingId || null,
            type: template.type,
            channel: template.channel,
            title: interpolateTemplate(template.title, notifData.data || {}),
            message: interpolateTemplate(template.message, notifData.data || {}),
            data: {
              priority: template.priority,
              persistent: template.persistent || false,
              actions: template.actions,
              dismissed: false,
              ...notifData.data
            },
            isRead: false,
            sentAt: new Date(),
            status: NotificationStatus.SENT
          });
        }

        const createdNotifications = await db.notification.createMany({
          data: bulkNotifications
        });

        return NextResponse.json({
          success: true,
          count: createdNotifications.count,
          message: `${createdNotifications.count} notifications created`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}