import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';
import { emailService } from '@/lib/services/emailService.simple';

const prisma = new PrismaClient();

// POST /api/bookings/[id]/notify - Send status update email
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    // Get booking details with all relations
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 2 // Get current and previous status
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (!booking.customer.email) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Get status message based on current status
    const statusMessages: Record<string, string> = {
      'PENDING': 'Your booking has been created and is awaiting confirmation.',
      'CONFIRMED': 'Your booking has been confirmed and we are ready to receive your device.',
      'DEVICE_RECEIVED': 'We have received your device and it will be diagnosed shortly.',
      'DIAGNOSING': 'Our technicians are currently diagnosing your device to identify all issues.',
      'QUOTE_SENT': 'We have completed the diagnosis and sent you a repair quote.',
      'QUOTE_ACCEPTED': 'Thank you for accepting the quote. We will begin repairs shortly.',
      'IN_REPAIR': 'Your device is currently being repaired by our expert technicians.',
      'REPAIR_COMPLETE': 'Great news! The repair has been completed successfully.',
      'QUALITY_CHECK': 'Your device is undergoing final quality checks.',
      'READY_FOR_COLLECTION': 'Your device is ready for collection or shipping.',
      'COMPLETED': 'Your repair has been completed and delivered. Thank you for choosing RevivaTech!',
      'CANCELLED': 'Your booking has been cancelled as requested.',
      'ON_HOLD': 'Your repair is currently on hold. We will contact you with more information.'
    };

    const previousStatus = booking.statusHistory[1]?.status || 'PENDING';
    const currentStatus = booking.status;
    
    // Queue status update email
    const emailId = await emailService.queueEmail({
      to: booking.customer.email,
      subject: `Repair Update: ${booking.deviceModel.brand.name} ${booking.deviceModel.name}`,
      template: 'repair-status-update',
      data: {
        customerName: booking.customer.name || 'Valued Customer',
        bookingReference: booking.reference || booking.id.slice(-8).toUpperCase(),
        device: {
          brand: booking.deviceModel.brand.name,
          model: booking.deviceModel.name
        },
        previousStatus: previousStatus.toLowerCase().replace(/_/g, '-'),
        newStatus: currentStatus.toLowerCase().replace(/_/g, '-'),
        statusMessage: statusMessages[currentStatus] || 'Your repair status has been updated.',
        estimatedCompletion: booking.estimatedCompletionDate?.toLocaleDateString('en-GB'),
        timeline: [
          {
            status: 'Device Received',
            date: booking.createdAt.toLocaleDateString('en-GB'),
            completed: ['DEVICE_RECEIVED', 'DIAGNOSING', 'IN_REPAIR', 'REPAIR_COMPLETE', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(currentStatus)
          },
          {
            status: 'Diagnosis',
            date: 'In Progress',
            completed: ['DIAGNOSING', 'IN_REPAIR', 'REPAIR_COMPLETE', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(currentStatus)
          },
          {
            status: 'Repair',
            date: 'Pending',
            completed: ['IN_REPAIR', 'REPAIR_COMPLETE', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(currentStatus)
          },
          {
            status: 'Quality Check',
            date: 'Pending',
            completed: ['QUALITY_CHECK', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(currentStatus)
          },
          {
            status: 'Ready for Delivery',
            date: 'Pending',
            completed: ['READY_FOR_COLLECTION', 'COMPLETED'].includes(currentStatus)
          }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      emailId,
      message: 'Status update email queued successfully'
    });

  } catch (error) {
    console.error('Error sending booking notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}