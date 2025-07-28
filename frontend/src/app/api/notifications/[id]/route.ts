// Individual Notification API
// Mark as read/unread, reschedule, cancel notifications

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware } from '@/lib/api/middleware';
import { createNotificationRepository } from '@/lib/database';
import { NotificationStatus } from '@/generated/prisma';

// Validation schemas
const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  scheduledFor: z.string().datetime().optional(),
  status: z.nativeEnum(NotificationStatus).optional(),
});

// GET /api/notifications/[id] - Get notification by ID
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const notificationRepo = createNotificationRepository();
    const user = (request as any).user;

    try {
      const notification = await notificationRepo.findById(params.id, {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        booking: {
          include: {
            deviceModel: {
              include: {
                brand: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      });

      if (!notification) {
        return ApiMiddleware.createErrorResponse('Notification not found', 404);
      }

      // Authorization check - customers can only see their own notifications
      if (user.role === 'CUSTOMER' && notification.userId !== user.id) {
        return ApiMiddleware.createErrorResponse('Access denied', 403);
      }

      return ApiMiddleware.createResponse(notification);
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 200 },
  }
);

// PUT /api/notifications/[id] - Update notification
export const PUT = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const notificationRepo = createNotificationRepository();
    const user = (request as any).user;
    const updateData = (request as any).validatedBody as z.infer<typeof updateNotificationSchema>;

    try {
      const existingNotification = await notificationRepo.findById(params.id);
      if (!existingNotification) {
        return ApiMiddleware.createErrorResponse('Notification not found', 404);
      }

      // Authorization check
      if (user.role === 'CUSTOMER') {
        // Customers can only update their own notifications and only certain fields
        if (existingNotification.userId !== user.id) {
          return ApiMiddleware.createErrorResponse('Access denied', 403);
        }
        
        // Customers can only mark as read/unread
        const allowedFields = ['isRead'];
        const hasDisallowedFields = Object.keys(updateData).some(
          field => !allowedFields.includes(field)
        );
        
        if (hasDisallowedFields) {
          return ApiMiddleware.createErrorResponse('Customers can only mark notifications as read/unread', 403);
        }
      }

      let updatedNotification;

      // Handle specific update types
      if (updateData.isRead !== undefined) {
        if (updateData.isRead) {
          updatedNotification = await notificationRepo.markAsRead(params.id);
        } else {
          updatedNotification = await notificationRepo.markAsUnread(params.id);
        }
      }

      if (updateData.scheduledFor) {
        updatedNotification = await notificationRepo.rescheduleNotification(
          params.id,
          new Date(updateData.scheduledFor)
        );
      }

      if (updateData.status) {
        updatedNotification = await notificationRepo.updateNotificationStatus(
          params.id,
          updateData.status
        );
      }

      // If no specific updates were made, do a general update
      if (!updatedNotification) {
        const updatePayload: any = {};
        if (updateData.scheduledFor) {
          updatePayload.scheduledFor = new Date(updateData.scheduledFor);
        }
        if (updateData.status) {
          updatePayload.status = updateData.status;
        }

        updatedNotification = await notificationRepo.update(params.id, updatePayload);
      }

      return ApiMiddleware.createResponse(
        updatedNotification,
        'Notification updated successfully'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    validateBody: updateNotificationSchema,
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);

// DELETE /api/notifications/[id] - Cancel notification
export const DELETE = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const notificationRepo = createNotificationRepository();
    const user = (request as any).user;

    try {
      const existingNotification = await notificationRepo.findById(params.id);
      if (!existingNotification) {
        return ApiMiddleware.createErrorResponse('Notification not found', 404);
      }

      // Authorization check
      if (user.role === 'CUSTOMER' && existingNotification.userId !== user.id) {
        return ApiMiddleware.createErrorResponse('Access denied', 403);
      }

      // Check if notification can be cancelled
      const cancellableStatuses = [NotificationStatus.PENDING, NotificationStatus.FAILED];
      if (!cancellableStatuses.includes(existingNotification.status)) {
        return ApiMiddleware.createErrorResponse(
          `Cannot cancel notification with status: ${existingNotification.status}`,
          400
        );
      }

      // Cancel the notification instead of deleting it
      const cancelledNotification = await notificationRepo.cancelScheduledNotification(params.id);

      return ApiMiddleware.createResponse(
        cancelledNotification,
        'Notification cancelled successfully'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 50 },
  }
);