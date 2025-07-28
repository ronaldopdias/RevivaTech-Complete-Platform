// Booking Status Management API
// Dedicated endpoint for status updates with proper workflow validation

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware } from '@/lib/api/middleware';
import { 
  createBookingRepository, 
  createNotificationRepository,
  createUserRepository
} from '@/lib/database';
import { BookingStatus, NotificationType, NotificationChannel } from '@/generated/prisma';

// Validation schema
const statusUpdateSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  notes: z.string().max(500).optional(),
  assignTechnician: z.boolean().optional(),
  estimatedCompletion: z.string().datetime().optional(),
});

// Status transition validation
const VALID_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.WAITING_PARTS, BookingStatus.WAITING_APPROVAL, BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.WAITING_PARTS]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.WAITING_APPROVAL]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [BookingStatus.REFUNDED], // Only admins can refund
  [BookingStatus.CANCELLED]: [], // Cannot transition from cancelled
  [BookingStatus.REFUNDED]: [], // Final state
};

// POST /api/bookings/[id]/status - Update booking status
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bookingRepo = createBookingRepository();
    const notificationRepo = createNotificationRepository();
    const userRepo = createUserRepository();
    
    const user = (request as any).user;
    const { status, notes, assignTechnician, estimatedCompletion } = 
      (request as any).validatedBody as z.infer<typeof statusUpdateSchema>;

    try {
      // Get current booking
      const booking = await bookingRepo.findBookingWithDetails(params.id);
      if (!booking) {
        return ApiMiddleware.createErrorResponse('Booking not found', 404);
      }

      // Authorization check
      if (user.role === 'CUSTOMER') {
        return ApiMiddleware.createErrorResponse('Customers cannot update booking status', 403);
      }

      // Validate status transition
      const validTransitions = VALID_STATUS_TRANSITIONS[booking.status];
      if (!validTransitions.includes(status)) {
        return ApiMiddleware.createErrorResponse(
          `Invalid status transition from ${booking.status} to ${status}`,
          400
        );
      }

      // Special authorization for refunds
      if (status === BookingStatus.REFUNDED && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return ApiMiddleware.createErrorResponse('Only administrators can process refunds', 403);
      }

      // Prepare update data
      const updateData: any = {};
      
      if (estimatedCompletion) {
        updateData.estimatedCompletion = new Date(estimatedCompletion);
      }

      if (assignTechnician && status === BookingStatus.CONFIRMED) {
        // Auto-assign technician if requested
        const technicians = await userRepo.findByRole('TECHNICIAN');
        if (technicians.length > 0) {
          // Simple round-robin assignment (in production, use more sophisticated logic)
          const availableTechnician = technicians[Math.floor(Math.random() * technicians.length)];
          updateData.assignedTechnicianId = availableTechnician.id;
        }
      }

      if (status === BookingStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      // Update booking status
      const updatedBooking = await bookingRepo.updateBookingStatus(
        params.id,
        status,
        notes || `Status updated to ${status}`,
        user.id
      );

      // Apply additional updates if any
      if (Object.keys(updateData).length > 0) {
        await bookingRepo.update(params.id, updateData);
      }

      // Generate appropriate notification message
      let notificationTitle: string;
      let notificationMessage: string;
      let notificationType: NotificationType;

      switch (status) {
        case BookingStatus.CONFIRMED:
          notificationTitle = 'Booking Confirmed';
          notificationMessage = 'Your booking has been confirmed and assigned to a technician.';
          notificationType = NotificationType.STATUS_UPDATE;
          break;
        case BookingStatus.IN_PROGRESS:
          notificationTitle = 'Repair Started';
          notificationMessage = 'Your device repair has started. We will keep you updated on the progress.';
          notificationType = NotificationType.STATUS_UPDATE;
          break;
        case BookingStatus.WAITING_PARTS:
          notificationTitle = 'Waiting for Parts';
          notificationMessage = 'We are waiting for replacement parts for your device. We will update you once they arrive.';
          notificationType = NotificationType.STATUS_UPDATE;
          break;
        case BookingStatus.WAITING_APPROVAL:
          notificationTitle = 'Approval Required';
          notificationMessage = 'Additional work is needed on your device. Please review and approve the additional charges.';
          notificationType = NotificationType.PAYMENT_REQUEST;
          break;
        case BookingStatus.COMPLETED:
          notificationTitle = 'Repair Completed';
          notificationMessage = 'Your device repair has been completed! You can now collect your device.';
          notificationType = NotificationType.COMPLETION_NOTICE;
          break;
        case BookingStatus.CANCELLED:
          notificationTitle = 'Booking Cancelled';
          notificationMessage = 'Your booking has been cancelled. If you have any questions, please contact us.';
          notificationType = NotificationType.STATUS_UPDATE;
          break;
        case BookingStatus.REFUNDED:
          notificationTitle = 'Refund Processed';
          notificationMessage = 'Your refund has been processed and will appear in your account within 3-5 business days.';
          notificationType = NotificationType.STATUS_UPDATE;
          break;
        default:
          notificationTitle = 'Status Update';
          notificationMessage = `Your booking status has been updated to: ${status}`;
          notificationType = NotificationType.STATUS_UPDATE;
      }

      // Send notification to customer
      await notificationRepo.createNotification({
        userId: booking.customerId,
        bookingId: params.id,
        type: notificationType,
        channel: NotificationChannel.EMAIL,
        title: notificationTitle,
        message: notificationMessage,
        data: {
          bookingId: params.id,
          oldStatus: booking.status,
          newStatus: status,
          deviceName: `${booking.deviceModel.brand.name} ${booking.deviceModel.name}`,
          technicianName: updateData.assignedTechnicianId ? 'Assigned' : undefined,
          estimatedCompletion: updateData.estimatedCompletion,
          notes: notes,
        },
      });

      // Also send WebSocket notification for real-time updates
      await notificationRepo.createNotification({
        userId: booking.customerId,
        bookingId: params.id,
        type: notificationType,
        channel: NotificationChannel.WEBSOCKET,
        title: notificationTitle,
        message: notificationMessage,
        data: {
          bookingId: params.id,
          status: status,
          timestamp: new Date().toISOString(),
        },
      });

      // Fetch updated booking with details
      const completeBooking = await bookingRepo.findBookingWithDetails(params.id);

      return ApiMiddleware.createResponse(
        {
          booking: completeBooking,
          statusHistory: completeBooking?.statusHistory?.slice(0, 5), // Last 5 status changes
        },
        `Booking status updated to ${status}`
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    roles: ['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'],
    validateBody: statusUpdateSchema,
    rateLimit: { windowMs: 60000, maxRequests: 50 },
  }
);

// GET /api/bookings/[id]/status - Get status history
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bookingRepo = createBookingRepository();
    const user = (request as any).user;

    try {
      const booking = await bookingRepo.findBookingWithDetails(params.id);
      if (!booking) {
        return ApiMiddleware.createErrorResponse('Booking not found', 404);
      }

      // Authorization check
      if (user.role === 'CUSTOMER' && booking.customerId !== user.id) {
        return ApiMiddleware.createErrorResponse('Access denied', 403);
      }

      return ApiMiddleware.createResponse({
        bookingId: params.id,
        currentStatus: booking.status,
        statusHistory: booking.statusHistory || [],
        validTransitions: VALID_STATUS_TRANSITIONS[booking.status],
      });
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);