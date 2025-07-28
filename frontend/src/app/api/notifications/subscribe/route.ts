import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }),
  userId: z.string().optional()
});

/**
 * POST /api/notifications/subscribe
 * Subscribe user to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription data',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { subscription, userId } = validation.data;

    // Store subscription in database
    // In a real implementation, you would save this to your database
    const subscriptionRecord = {
      id: generateId(),
      userId: userId || 'anonymous',
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      createdAt: new Date(),
      isActive: true
    };

    // Push subscription saved successfully

    // Store in session/memory for demo purposes
    // In production, save to database
    storeSubscription(subscriptionRecord);

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionRecord.id,
      message: 'Successfully subscribed to push notifications'
    });

  } catch (error) {
    // Push subscription error occurred
    
    return NextResponse.json({
      success: false,
      error: 'Failed to subscribe to push notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/notifications/subscribe
 * Get subscription status for user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Get subscription from database
    const subscription = getSubscriptionByUserId(userId);

    return NextResponse.json({
      success: true,
      subscribed: !!subscription,
      subscription: subscription ? {
        id: subscription.id,
        createdAt: subscription.createdAt,
        isActive: subscription.isActive
      } : null
    });

  } catch (error) {
    // Get subscription status error occurred
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get subscription status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions (in production, these would interact with your database)
function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory storage for demo purposes
const subscriptions = new Map<string, any>();

function storeSubscription(subscription: any): void {
  subscriptions.set(subscription.userId, subscription);
}

function getSubscriptionByUserId(userId: string): any {
  return subscriptions.get(userId);
}

export function getAllSubscriptions(): any[] {
  return Array.from(subscriptions.values());
}