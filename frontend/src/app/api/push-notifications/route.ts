import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Mock database for demo - in production, use your database
interface PushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceType?: string;
  userAgent?: string;
  createdAt: Date;
  isActive: boolean;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

// In-memory storage for demo - use Redis/Database in production
const mockSubscriptions: Map<string, PushSubscription> = new Map();
const vapidKeys = {
  publicKey: 'BPFhZZkZxUfNKs4Sl2fK8ggNrJRPd1rHGe1n2W9t4tJcL7pP2qN8z5vK9xM3w6sR',
  privateKey: 'your-vapid-private-key-here' // In production, store securely
};

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'subscribe':
        return handleSubscribe(data, userAgent);
      
      case 'unsubscribe':
        return handleUnsubscribe(data);
      
      case 'send-notification':
        return handleSendNotification(data);
      
      case 'send-bulk':
        return handleSendBulkNotifications(data);
      
      case 'get-subscriptions':
        return handleGetSubscriptions(data);
      
      case 'test-notification':
        return handleTestNotification(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Push notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'vapid-public-key':
        return NextResponse.json({
          publicKey: vapidKeys.publicKey
        });
      
      case 'health':
        return NextResponse.json({
          status: 'healthy',
          service: 'push-notifications',
          subscriptions: mockSubscriptions.size,
          timestamp: new Date().toISOString()
        });
      
      case 'stats':
        const activeSubscriptions = Array.from(mockSubscriptions.values())
          .filter(sub => sub.isActive);
        
        const deviceStats = activeSubscriptions.reduce((acc, sub) => {
          const device = sub.deviceType || 'unknown';
          acc[device] = (acc[device] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          total: mockSubscriptions.size,
          active: activeSubscriptions.length,
          inactive: mockSubscriptions.size - activeSubscriptions.length,
          deviceTypes: deviceStats,
          lastActivity: new Date().toISOString()
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Push notification GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSubscribe(data: any, userAgent: string) {
  const { subscription, userId, deviceType } = data;
  
  if (!subscription || !subscription.endpoint) {
    return NextResponse.json(
      { error: 'Invalid subscription data' },
      { status: 400 }
    );
  }

  const subscriptionId = generateSubscriptionId(subscription.endpoint);
  const pushSubscription: PushSubscription = {
    id: subscriptionId,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    },
    userId: userId || 'anonymous',
    deviceType: deviceType || detectDeviceType(userAgent),
    userAgent,
    createdAt: new Date(),
    isActive: true
  };

  mockSubscriptions.set(subscriptionId, pushSubscription);

  console.log(`📱 Push subscription created: ${subscriptionId} (${pushSubscription.deviceType})`);

  return NextResponse.json({
    success: true,
    subscriptionId,
    message: 'Push notifications enabled successfully',
    deviceType: pushSubscription.deviceType
  });
}

async function handleUnsubscribe(data: any) {
  const { subscriptionId, endpoint } = data;
  
  let targetId = subscriptionId;
  if (!targetId && endpoint) {
    targetId = generateSubscriptionId(endpoint);
  }

  if (!targetId) {
    return NextResponse.json(
      { error: 'Subscription ID or endpoint required' },
      { status: 400 }
    );
  }

  const subscription = mockSubscriptions.get(targetId);
  if (subscription) {
    subscription.isActive = false;
    mockSubscriptions.set(targetId, subscription);
    
    console.log(`📱 Push subscription disabled: ${targetId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Push notifications disabled'
    });
  }

  return NextResponse.json(
    { error: 'Subscription not found' },
    { status: 404 }
  );
}

async function handleSendNotification(data: any) {
  const { subscriptionId, notification } = data;
  
  if (!subscriptionId || !notification) {
    return NextResponse.json(
      { error: 'Subscription ID and notification data required' },
      { status: 400 }
    );
  }

  const subscription = mockSubscriptions.get(subscriptionId);
  if (!subscription || !subscription.isActive) {
    return NextResponse.json(
      { error: 'Invalid or inactive subscription' },
      { status: 404 }
    );
  }

  // In production, use a real push service like web-push
  const result = await sendPushNotification(subscription, notification);
  
  if (result.success) {
    console.log(`📱 Notification sent to ${subscriptionId}:`, notification.title);
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notificationId: generateNotificationId()
    });
  } else {
    return NextResponse.json(
      { error: 'Failed to send notification', details: result.error },
      { status: 500 }
    );
  }
}

async function handleSendBulkNotifications(data: any) {
  const { notification, filters } = data;
  
  if (!notification) {
    return NextResponse.json(
      { error: 'Notification data required' },
      { status: 400 }
    );
  }

  // Filter subscriptions based on criteria
  let targetSubscriptions = Array.from(mockSubscriptions.values())
    .filter(sub => sub.isActive);

  if (filters) {
    if (filters.userId) {
      targetSubscriptions = targetSubscriptions.filter(sub => sub.userId === filters.userId);
    }
    if (filters.deviceType) {
      targetSubscriptions = targetSubscriptions.filter(sub => sub.deviceType === filters.deviceType);
    }
    if (filters.userIds && Array.isArray(filters.userIds)) {
      targetSubscriptions = targetSubscriptions.filter(sub => 
        filters.userIds.includes(sub.userId)
      );
    }
  }

  console.log(`📱 Sending bulk notification to ${targetSubscriptions.length} devices`);

  // Send notifications concurrently
  const results = await Promise.allSettled(
    targetSubscriptions.map(subscription => 
      sendPushNotification(subscription, notification)
    )
  );

  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;

  const failed = results.length - successful;

  return NextResponse.json({
    success: true,
    message: `Bulk notification completed`,
    stats: {
      total: targetSubscriptions.length,
      successful,
      failed
    },
    notificationId: generateNotificationId()
  });
}

async function handleGetSubscriptions(data: any) {
  const { userId } = data;
  
  let subscriptions = Array.from(mockSubscriptions.values());
  
  if (userId) {
    subscriptions = subscriptions.filter(sub => sub.userId === userId);
  }

  // Remove sensitive data before sending
  const sanitizedSubscriptions = subscriptions.map(sub => ({
    id: sub.id,
    userId: sub.userId,
    deviceType: sub.deviceType,
    isActive: sub.isActive,
    createdAt: sub.createdAt
  }));

  return NextResponse.json({
    success: true,
    subscriptions: sanitizedSubscriptions,
    total: sanitizedSubscriptions.length
  });
}

async function handleTestNotification(data: any) {
  const { subscriptionId } = data;
  
  const testNotification: NotificationPayload = {
    title: '🎉 RevivaTech Test',
    body: 'This is a test notification from RevivaTech. Your push notifications are working perfectly!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `test-${Date.now()}`,
    data: {
      type: 'test',
      url: '/dashboard',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-close.png'
      }
    ],
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return handleSendNotification({ 
    subscriptionId, 
    notification: testNotification 
  });
}

// Utility functions

function generateSubscriptionId(endpoint: string): string {
  // Create a hash of the endpoint for consistent ID
  return Buffer.from(endpoint).toString('base64').slice(0, 16);
}

function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

async function sendPushNotification(
  subscription: PushSubscription, 
  notification: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, use web-push library:
    // const webpush = require('web-push');
    // webpush.setVapidDetails(
    //   'mailto:hello@revivatech.co.uk',
    //   vapidKeys.publicKey,
    //   vapidKeys.privateKey
    // );
    // 
    // const result = await webpush.sendNotification(
    //   {
    //     endpoint: subscription.endpoint,
    //     keys: subscription.keys
    //   },
    //   JSON.stringify(notification)
    // );

    // Mock successful send for demo
    console.log(`📱 [MOCK] Sending notification to ${subscription.id}:`, {
      title: notification.title,
      deviceType: subscription.deviceType,
      endpoint: subscription.endpoint.slice(0, 50) + '...'
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return { success: true };
  } catch (error) {
    console.error('Push notification send error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Export notification types for use in other parts of the app
export type { NotificationPayload, PushSubscription };