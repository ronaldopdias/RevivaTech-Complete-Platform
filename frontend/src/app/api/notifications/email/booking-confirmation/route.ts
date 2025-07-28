import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';
import type { BookingConfirmationData } from '@/lib/services/emailTemplates/booking-confirmation';

// POST /api/notifications/email/booking-confirmation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['to', 'bookingData'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate booking data structure
    const { bookingData } = body;
    if (!bookingData.customerName || !bookingData.bookingReference || !bookingData.device || !bookingData.service) {
      return NextResponse.json(
        { error: 'Invalid booking data structure' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending booking confirmation email to: ${body.to} for booking: ${bookingData.bookingReference}`);

    // Queue email for sending
    const emailId = await emailService.queueEmail({
      to: body.to,
      subject: `Booking Confirmation - ${bookingData.bookingReference}`,
      template: 'booking-confirmation',
      data: bookingData
    });

    return NextResponse.json({
      success: true,
      emailId,
      message: 'Booking confirmation email queued for delivery',
      bookingReference: bookingData.bookingReference
    });

  } catch (error) {
    console.error('Booking confirmation email API error:', error);
    return NextResponse.json(
      { error: 'Failed to queue booking confirmation email' },
      { status: 500 }
    );
  }
}

// Example of expected request body:
/*
{
  "to": "customer@example.com",
  "bookingData": {
    "customerName": "John Smith",
    "bookingReference": "RT-2025-001234",
    "device": {
      "brand": "Apple",
      "model": "MacBook Pro 2023",
      "issues": ["Screen cracked", "Battery not charging"]
    },
    "service": {
      "type": "Screen Replacement + Battery Replacement",
      "urgency": "Standard",
      "estimatedCost": 449.99,
      "estimatedDays": 3
    },
    "appointment": {
      "date": "2025-07-16",
      "time": "10:00 AM",
      "type": "Drop-off"
    },
    "nextSteps": [
      "We will contact you within 2 hours to confirm your appointment",
      "Bring your device to our Shoreditch location",
      "Our technician will perform a free diagnostic",
      "You will receive a detailed quote before any work begins"
    ]
  }
}
*/