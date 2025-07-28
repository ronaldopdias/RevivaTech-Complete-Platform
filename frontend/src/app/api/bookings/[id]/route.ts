// Individual Booking API
// CRUD operations and status management for specific bookings

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware } from '@/lib/api/middleware';
import { 
  createBookingRepository, 
  createNotificationRepository,
} from '@/lib/database';
import { BookingStatus, NotificationType, NotificationChannel } from '@/generated/prisma';

// Validation schemas
const updateBookingSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  scheduledDate: z.string().datetime().optional(),
  estimatedCompletion: z.string().datetime().optional(),
  assignedTechnicianId: z.string().uuid().optional(),
  internalNotes: z.string().max(1000).optional(),
  customerNotes: z.string().max(500).optional(),
});

const statusUpdateSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  notes: z.string().max(500).optional(),
});

// GET /api/bookings/[id] - Get booking by ID
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bookingRepo = createBookingRepository();
    const user = (request as any).user;

    try {
      const booking = await bookingRepo.findBookingWithDetails(params.id);

      if (!booking) {
        return ApiMiddleware.createErrorResponse('Booking not found', 404);
      }

      // Authorization check - customers can only see their own bookings
      if (user.role === 'CUSTOMER' && booking.customerId !== user.id) {
        return ApiMiddleware.createErrorResponse('Access denied', 403);
      }

      return ApiMiddleware.createResponse(booking);
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);

// PUT /api/bookings/[id] - Update booking
export const PUT = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bookingRepo = createBookingRepository();
    const user = (request as any).user;
    const updateData = (request as any).validatedBody as z.infer<typeof updateBookingSchema>;

    try {
      // Check if booking exists
      const existingBooking = await bookingRepo.findBookingWithDetails(params.id);
      if (!existingBooking) {
        return ApiMiddleware.createErrorResponse('Booking not found', 404);
      }

      // Authorization check
      if (user.role === 'CUSTOMER') {
        // Customers can only update their own bookings and only certain fields
        if (existingBooking.customerId !== user.id) {
          return ApiMiddleware.createErrorResponse('Access denied', 403);
        }
        
        // Customers can only update customer notes
        const allowedFields = ['customerNotes'];
        const hasDisallowedFields = Object.keys(updateData).some(
          field => !allowedFields.includes(field)
        );
        
        if (hasDisallowedFields) {
          return ApiMiddleware.createErrorResponse('Customers can only update customer notes', 403);
        }
      }

      // Handle status updates separately to create proper history
      if (updateData.status && updateData.status !== existingBooking.status) {
        const updatedBooking = await bookingRepo.updateBookingStatus(
          params.id,
          updateData.status,
          `Status updated to ${updateData.status}`,
          user.id
        );

        // Send status update notification
        const notificationRepo = createNotificationRepository();
        await notificationRepo.createNotification({
          userId: existingBooking.customerId,
          bookingId: params.id,
          type: NotificationType.STATUS_UPDATE,
          channel: NotificationChannel.EMAIL,
          title: 'Booking Status Update',
          message: `Your booking status has been updated to: ${updateData.status}`,
          data: {
            bookingId: params.id,
            oldStatus: existingBooking.status,
            newStatus: updateData.status,
            deviceName: `${existingBooking.deviceModel.brand.name} ${existingBooking.deviceModel.name}`,
          },
        });

        return ApiMiddleware.createResponse(
          updatedBooking,
          'Booking status updated successfully'
        );
      } else {
        // Regular field updates
        const updatedBooking = await bookingRepo.update(params.id, {
          scheduledDate: updateData.scheduledDate ? new Date(updateData.scheduledDate) : undefined,
          estimatedCompletion: updateData.estimatedCompletion ? new Date(updateData.estimatedCompletion) : undefined,
          assignedTechnicianId: updateData.assignedTechnicianId,
          internalNotes: updateData.internalNotes,
          customerNotes: updateData.customerNotes,
        });

        // Fetch complete booking data for response
        const completeBooking = await bookingRepo.findBookingWithDetails(updatedBooking.id);

        return ApiMiddleware.createResponse(
          completeBooking,
          'Booking updated successfully'
        );
      }
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    validateBody: updateBookingSchema,
    rateLimit: { windowMs: 60000, maxRequests: 50 },
  }
);

// DELETE /api/bookings/[id] - Cancel booking
export const DELETE = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bookingRepo = createBookingRepository();
    const user = (request as any).user;

    try {
      const existingBooking = await bookingRepo.findBookingWithDetails(params.id);
      if (!existingBooking) {
        return ApiMiddleware.createErrorResponse('Booking not found', 404);
      }

      // Authorization check
      if (user.role === 'CUSTOMER' && existingBooking.customerId !== user.id) {
        return ApiMiddleware.createErrorResponse('Access denied', 403);
      }

      // Check if booking can be cancelled
      const nonCancellableStatuses = [BookingStatus.COMPLETED, BookingStatus.CANCELLED];
      if (nonCancellableStatuses.includes(existingBooking.status)) {
        return ApiMiddleware.createErrorResponse(
          `Cannot cancel booking with status: ${existingBooking.status}`, 
          400
        );
      }

      // Cancel the booking
      const cancelledBooking = await bookingRepo.cancelBooking(
        params.id,
        'Cancelled by user',
        user.id
      );

      // Send cancellation notification
      const notificationRepo = createNotificationRepository();
      await notificationRepo.createNotification({
        userId: existingBooking.customerId,
        bookingId: params.id,
        type: NotificationType.STATUS_UPDATE,
        channel: NotificationChannel.EMAIL,
        title: 'Booking Cancelled',
        message: `Your booking has been cancelled. Booking ID: ${params.id}`,
        data: {
          bookingId: params.id,
          deviceName: `${existingBooking.deviceModel.brand.name} ${existingBooking.deviceModel.name}`,
          cancelledBy: user.role,
        },
      });

      return ApiMiddleware.createResponse(
        cancelledBooking,
        'Booking cancelled successfully'
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