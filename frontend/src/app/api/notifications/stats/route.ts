// Notification Statistics API
// Analytics and metrics for notification system

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware, commonSchemas } from '@/lib/api/middleware';
import { createNotificationRepository } from '@/lib/database';

// Validation schema
const statsQuerySchema = z.object({
  ...commonSchemas.dateRange.shape,
  userId: z.string().uuid().optional(),
});

// GET /api/notifications/stats - Get notification statistics
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const notificationRepo = createNotificationRepository();
    const user = (request as any).user;
    const searchParams = (request as any).validatedQuery as z.infer<typeof statsQuerySchema>;

    try {
      let effectiveUserId = searchParams.userId;
      
      // Customers can only see their own stats
      if (user.role === 'CUSTOMER') {
        effectiveUserId = user.id;
      }

      if (effectiveUserId) {
        // User-specific stats
        const [unreadCount, userNotifications] = await Promise.all([
          notificationRepo.getUnreadCount(effectiveUserId),
          notificationRepo.findUserNotifications(effectiveUserId, { page: 1, limit: 10 }, false),
        ]);

        const recentNotifications = Array.isArray(userNotifications) 
          ? userNotifications 
          : userNotifications.data;

        return ApiMiddleware.createResponse({
          userId: effectiveUserId,
          unreadCount,
          recentCount: recentNotifications.length,
          recentNotifications: recentNotifications.slice(0, 5).map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            createdAt: n.createdAt,
            isRead: n.isRead,
          })),
        });
      } else {
        // System-wide stats (admin only)
        if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          return ApiMiddleware.createErrorResponse('Access denied', 403);
        }

        const stats = await notificationRepo.getNotificationStats();

        // Get date range statistics if provided
        let dateRangeStats = null;
        if (searchParams.startDate && searchParams.endDate) {
          dateRangeStats = await notificationRepo.getNotificationsByDateRange(
            new Date(searchParams.startDate),
            new Date(searchParams.endDate),
            'day'
          );
        }

        return ApiMiddleware.createResponse({
          overall: stats,
          dateRange: dateRangeStats,
          performance: {
            successRate: stats.successRate,
            totalVolume: stats.total,
            channels: stats.byChannel,
            types: stats.byType,
          },
        });
      }
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    validateQuery: statsQuerySchema,
    rateLimit: { windowMs: 60000, maxRequests: 50 },
  }
);