// Mark All Notifications as Read API
// Bulk operation for user notification management

import { NextRequest } from 'next/server';
import { ApiMiddleware } from '@/lib/api/middleware';
import { createNotificationRepository } from '@/lib/database';

// POST /api/notifications/mark-all-read - Mark all user notifications as read
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const notificationRepo = createNotificationRepository();
    const user = (request as any).user;

    try {
      // Mark all notifications as read for the current user
      const result = await notificationRepo.markAllAsRead(user.id);

      return ApiMiddleware.createResponse(
        { markedCount: result.count },
        `Marked ${result.count} notifications as read`
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }
);