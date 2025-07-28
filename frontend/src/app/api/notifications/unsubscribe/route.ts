import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const unsubscribeSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe user from push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = unsubscribeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid unsubscribe data',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { userId } = validation.data;

    // Remove subscription from database
    // In a real implementation, you would remove this from your database
    const removed = removeSubscription(userId);

    if (removed) {
      console.log('🗑️ Push subscription removed for user:', userId);
      
      return NextResponse.json({
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No subscription found for this user'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Push unsubscribe error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to unsubscribe from push notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function (in production, this would interact with your database)
const subscriptions = new Map<string, any>();

function removeSubscription(userId: string): boolean {
  return subscriptions.delete(userId);
}